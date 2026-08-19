import { NextResponse } from "next/server";
import { createElement } from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import QRCode from "qrcode";
import { accessErrorResponse } from "@/lib/api-errors";
import { assertCanAccessCandidate } from "@/lib/auth";
import { buildDocumentVerificationUrl, resolvePublicAppOrigin } from "@/lib/generated-documents";
import { resolveKarineTrainerSignature } from "@/lib/document-signatures";
import { CertificateDocument } from "@/lib/pdf/documents";
import { getOrganizationBranding } from "@/lib/organization";
import { createClient } from "@/lib/supabase/server";
import type { SessionCandidate, SessionItem } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(request: Request, context: { params: Promise<{ candidateSessionId: string }> }) {
  const { candidateSessionId } = await context.params;
  const requestUrl = new URL(request.url);
  const origin = requestUrl.origin;
  let documentRef = requestUrl.searchParams.get("ref")?.trim() || null;
  try {
    await assertCanAccessCandidate(candidateSessionId);
  } catch (error) {
    const accessResponse = accessErrorResponse(error);
    if (accessResponse) {
      return accessResponse;
    }

    return NextResponse.json({ message: "Document introuvable." }, { status: 404 });
  }

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
        sst_certificate_ref,
        sst_certificate_obtained_at,
        sst_certificate_expires_at,
        forprev_registration_status,
        created_at,
        training_sessions (
          id,
          title,
          start_date,
          end_date,
          location,
          status,
          training_type,
          training_family,
          source_quote_id,
          trainer_id,
          trainer_user_id,
          trainer_name,
          duration_hours,
          prerequisites,
          objectives,
          programme_outline,
          accessibility_details,
          mac_previous_certificate_date,
          mac_previous_certificate_ref,
          created_at
        )
      `
    )
    .eq("id", candidateSessionId)
    .single();

  if (error || !candidateRow) {
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
      validated_at: candidateRow.validated_at,
      sst_certificate_ref: candidateRow.sst_certificate_ref ?? null,
      sst_certificate_obtained_at: candidateRow.sst_certificate_obtained_at ?? null,
      sst_certificate_expires_at: candidateRow.sst_certificate_expires_at ?? null,
      forprev_registration_status: candidateRow.forprev_registration_status ?? "non_applicable"
    },
    evaluations: []
  };

  const { data: evaluations } = await supabase
    .from("candidate_evaluations")
    .select("id, session_id, candidate_id, evaluation_type, status, result, trainer_notes, evaluated_at, evaluated_by, metadata, created_at, updated_at")
    .eq("candidate_id", candidateSessionId)
    .eq("session_id", session.id)
    .order("evaluated_at", { ascending: false, nullsFirst: false });

  candidateSession.evaluations = evaluations ?? [];

  const organizationSettings = await getOrganizationBranding(origin);
  if (!documentRef) {
    const { data: generatedDocument } = await supabase
      .from("generated_documents")
      .select("document_ref")
      .eq("candidate_id", candidateSessionId)
      .in("document_type", ["attestation", "certificat"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    documentRef = generatedDocument?.document_ref ?? null;
  }

  const publicOrigin = resolvePublicAppOrigin();
  const verificationUrl = documentRef && publicOrigin ? buildDocumentVerificationUrl(publicOrigin, documentRef) : null;
  const verificationQrCodeDataUrl = verificationUrl
    ? await QRCode.toDataURL(verificationUrl, {
        margin: 0,
        width: 180,
        errorCorrectionLevel: "M",
        color: {
          dark: "#1f3028",
          light: "#ffffff"
        }
      })
    : null;
  const trainerSignature = await resolveKarineTrainerSignature(session.trainer_user_id);
  const document = createElement(CertificateDocument as never, {
    session,
    candidateSession,
    organizationSettings,
    documentRef,
    verificationQrCodeDataUrl,
    trainerSignatureUrl: trainerSignature.signature?.src ?? null
  });
  const buffer = await renderToBuffer(document as never);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="attestation-${candidateSessionId}.pdf"`
    }
  });
}
