import { createElement } from "react";
import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { accessErrorResponse } from "@/lib/api-errors";
import { assertCanAccessCandidate } from "@/lib/auth";
import { AIParticipantGuideDocument } from "@/lib/pdf/ai-participant-guide";
import { getOrganizationBranding } from "@/lib/organization";
import { createClient } from "@/lib/supabase/server";
import type { SessionItem } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request, context: { params: Promise<{ candidateId: string }> }) {
  const { candidateId } = await context.params;
  try {
    await assertCanAccessCandidate(candidateId);
  } catch (error) {
    const accessResponse = accessErrorResponse(error);
    if (accessResponse) return accessResponse;
    return NextResponse.json({ message: "Document introuvable." }, { status: 404 });
  }

  const supabase = await createClient();
  const { data: candidate, error: candidateError } = await supabase
    .from("candidates")
    .select("id, session_id, first_name, last_name")
    .eq("id", candidateId)
    .maybeSingle();
  if (candidateError || !candidate?.session_id) return NextResponse.json({ message: "Candidat introuvable." }, { status: 404 });

  const { data: session, error: sessionError } = await supabase
    .from("training_sessions")
    .select("*")
    .eq("id", candidate.session_id)
    .maybeSingle<SessionItem>();
  if (sessionError || !session || session.training_type !== "ai") return NextResponse.json({ message: "Livret disponible uniquement pour une formation IA." }, { status: 404 });

  try {
    const origin = new URL(request.url).origin;
    const organizationSettings = await getOrganizationBranding(origin);
    const document = createElement(AIParticipantGuideDocument as never, {
      session,
      participantName: `${candidate.first_name} ${candidate.last_name}`.trim(),
      organizationSettings
    });
    const buffer = await renderToBuffer(document as never);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="livret-participant-ia-${candidateId}.pdf"`,
        "Cache-Control": "private, no-store, max-age=0, must-revalidate",
        Pragma: "no-cache"
      }
    });
  } catch (error) {
    console.error("[pdf/ai-participant-guide] generation failed", { candidateId, message: error instanceof Error ? error.message : "Unknown error" });
    return NextResponse.json({ message: "Impossible de générer le livret participant." }, { status: 500 });
  }
}
