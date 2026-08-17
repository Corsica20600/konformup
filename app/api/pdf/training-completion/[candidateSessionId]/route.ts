import { NextResponse } from "next/server";
import { createElement } from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { accessErrorResponse } from "@/lib/api-errors";
import { assertCanAccessCandidate } from "@/lib/auth";
import { TrainingCompletionCertificateDocument } from "@/lib/pdf/final-documents";
import { getOrganizationBranding } from "@/lib/organization";
import { getSessionById } from "@/lib/queries";

export const runtime = "nodejs";

export async function GET(request: Request, context: { params: Promise<{ candidateSessionId: string }> }) {
  const { candidateSessionId } = await context.params;
  const origin = new URL(request.url).origin;
  const documentRef = new URL(request.url).searchParams.get("ref")?.trim() || null;

  try {
    await assertCanAccessCandidate(candidateSessionId);
  } catch (error) {
    const accessResponse = accessErrorResponse(error);
    if (accessResponse) {
      return accessResponse;
    }

    return NextResponse.json({ message: "Document introuvable." }, { status: 404 });
  }

  const { supabase } = await assertCanAccessCandidate(candidateSessionId);
  const { data: candidate } = await supabase
    .from("candidates")
    .select("session_id")
    .eq("id", candidateSessionId)
    .maybeSingle<{ session_id: string | null }>();

  if (!candidate?.session_id) {
    return NextResponse.json({ message: "Session introuvable." }, { status: 404 });
  }

  const sessionData = await getSessionById(candidate.session_id);
  const candidateSession = sessionData.candidates.find((item) => item.candidate.id === candidateSessionId);

  if (!candidateSession) {
    return NextResponse.json({ message: "Candidat introuvable." }, { status: 404 });
  }

  const organizationSettings = await getOrganizationBranding(origin);
  const document = createElement(TrainingCompletionCertificateDocument as never, {
    session: sessionData.session,
    candidateSession,
    organizationSettings,
    documentRef
  });
  const buffer = await renderToBuffer(document as never);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="certificat-realisation-${candidateSessionId}.pdf"`
    }
  });
}
