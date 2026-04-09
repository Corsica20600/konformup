import { NextResponse } from "next/server";
import { createElement } from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { ConvocationDocument } from "@/lib/pdf/documents";
import { getOrganizationBranding } from "@/lib/organization";
import { createClient } from "@/lib/supabase/server";
import type { SessionCandidate, SessionItem } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(request: Request, context: { params: Promise<{ candidateSessionId: string }> }) {
  const { candidateSessionId } = await context.params;
  const origin = new URL(request.url).origin;
  const supabase = await createClient();

  const { data: candidateRow, error } = await supabase
    .from("candidates")
    .select(
      `
        id,
        session_id,
        first_name,
        last_name,
        email,
        company,
        phone,
        validation_status,
        validated_at,
        created_at,
        training_sessions (
          id,
          title,
          start_date,
          end_date,
          location,
          status,
          trainer_user_id,
          trainer_name,
          duration_hours,
          created_at
        )
      `
    )
    .eq("id", candidateSessionId)
    .single();

  if (error || !candidateRow) {
    console.error("[pdf/convocation] candidate lookup failed", {
      candidateSessionId,
      code: error?.code,
      message: error?.message,
      details: error?.details,
      hint: error?.hint
    });
    return NextResponse.json({ message: "Candidat introuvable." }, { status: 404 });
  }

  const session = (Array.isArray(candidateRow.training_sessions)
    ? candidateRow.training_sessions[0]
    : candidateRow.training_sessions) as SessionItem | null;

  if (!session) {
    return NextResponse.json({ message: "Session introuvable." }, { status: 404 });
  }

  const candidateSession: SessionCandidate = {
    id: candidateRow.id,
    session_id: candidateRow.session_id,
    global_progress: 0,
    candidate: {
      id: candidateRow.id,
      session_id: candidateRow.session_id,
      company_id: null,
      first_name: candidateRow.first_name,
      last_name: candidateRow.last_name,
      email: candidateRow.email,
      company: candidateRow.company,
      phone: candidateRow.phone,
      job_title: null,
      address: null,
      postal_code: null,
      city: null,
      validation_status: candidateRow.validation_status,
      validated_at: candidateRow.validated_at
    }
  };

  const organizationSettings = await getOrganizationBranding(origin);
  const document = createElement(ConvocationDocument as never, {
    session,
    candidateSession,
    organizationSettings
  });
  const buffer = await renderToBuffer(document as never);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="convocation-${candidateSessionId}.pdf"`
    }
  });
}
