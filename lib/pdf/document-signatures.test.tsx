import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { createElement } from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import QRCode from "qrcode";
import { afterEach, describe, expect, it } from "vitest";
import { resolveKarineTrainerSignature } from "@/lib/document-signatures";
import { CertificateDocument, ConvocationDocument, TrainingAgreementDocument } from "@/lib/pdf/documents";
import type { TrainingAgreementPdfData } from "@/lib/training-agreements";
import type { OrganizationBranding, SessionCandidate, SessionItem } from "@/lib/types";

const profileId = "00000000-0000-4000-8000-000000000042";
const originalProfileId = process.env.KONFORMUP_KARINE_TRAINER_PROFILE_ID;

const session: SessionItem = {
  id: "11111111-1111-4111-8111-111111111111", title: "Formation SST initiale", start_date: "2026-08-24", end_date: "2026-08-25", location: "Bastia", status: "completed", training_type: "sst_initial", training_family: "sst", source_quote_id: null, trainer_id: "22222222-2222-4222-8222-222222222222", trainer_user_id: profileId, trainer_name: "Karine Vannucci", duration_hours: 14, prerequisites: null, objectives: null, programme_outline: null, accessibility_details: null, mac_previous_certificate_date: null, mac_previous_certificate_ref: null, closure_status: "closed", closed_at: "2026-08-25T17:00:00.000Z", closed_by: profileId, trainer_report: null, administrative_observations: null, final_registered_count: 1, final_present_count: 1, final_admitted_count: 1, final_not_admitted_count: 0, final_absent_count: 0, created_at: "2026-08-01T00:00:00.000Z"
};

const candidateSession: SessionCandidate = {
  id: "33333333-3333-4333-8333-333333333333", session_id: session.id, global_progress: 100,
  candidate: { id: "33333333-3333-4333-8333-333333333333", session_id: session.id, company_id: "44444444-4444-4444-8444-444444444444", first_name: "Alice", last_name: "Martin", email: "alice@example.test", company: "Entreprise test", phone: null, job_title: null, address: null, postal_code: null, city: null, validation_status: "validated", validated_at: "2026-08-25T17:00:00.000Z", sst_certificate_ref: null, sst_certificate_obtained_at: null, sst_certificate_expires_at: null, forprev_registration_status: "a_saisir" }, evaluations: []
};

const organization: OrganizationBranding = {
  organization_name: "Konform'up", address: "2 rue Salicetti", postal_code: "20200", city: "Bastia", country: "France", siret: null, training_declaration_number: null, qualiopi_mention: null, legal_form: null, share_capital: null, vat_number: null, contact_email: "contact@example.test", contact_phone: "0102030405", payment_terms: null, late_penalty_terms: null, collection_fee_terms: null, vat_exemption_text: null, logo_url: null, signature_url: null, certificate_signatory_name: "Karine Vannucci", certificate_signatory_title: "Responsable pédagogique", resolved_logo_url: null, resolved_signature_url: null
};

const agreement = {
  quote: { quote_number: "DEV-2026-001" }, agreementRef: "CONV-2026-001", generatedAt: "2026-08-25T17:00:00.000Z",
  organization: { name: organization.organization_name, address: organization.address, postalCode: organization.postal_code, city: organization.city, email: organization.contact_email, phone: organization.contact_phone, siret: null, declarationNumber: null, representativeName: "Karine Vannucci", representativeTitle: "Responsable pédagogique" },
  client: { companyName: "Entreprise test", legalName: null, address: null, postalCode: null, city: null, contactName: null, contactEmail: null, contactPhone: null, siret: null },
  training: { title: session.title, typeLabel: "SST initial", objectives: ["Prévenir"], programmeLines: ["Séquence pédagogique"], durationHours: 14, durationLabel: "14 h", dateRangeLabel: "24 au 25 août 2026", locationLabel: "Bastia", modality: "Présentiel", prerequisites: "Aucun", accessibilityDetails: "Nous contacter", pedagogicalMeans: ["Apports"], evaluationMethods: ["Évaluation"], trainerName: session.trainer_name!, trainerProfileId: profileId, participantCount: 1, participantLabel: "1 participant", participants: [{ id: candidateSession.candidate.id, first_name: "Alice", last_name: "Martin", email: null, company: "Entreprise test" }] },
  financial: { priceHt: 1000, vatRate: 20, totalTtc: 1200, paymentTerms: "À réception", depositTerms: null },
  clauses: { purpose: "Objet", organization: "Organisation", pedagogicalMeans: "Moyens", followUp: "Suivi", financialTerms: "Financier", cancellation: "Annulation", obligations: "Obligations" }, missingFields: []
} as unknown as TrainingAgreementPdfData;

afterEach(() => {
  if (originalProfileId === undefined) delete process.env.KONFORMUP_KARINE_TRAINER_PROFILE_ID;
  else process.env.KONFORMUP_KARINE_TRAINER_PROFILE_ID = originalProfileId;
});

describe("signed PDF documents", () => {
  it("renders the eligible signature zones while retaining the SST verification QR", async () => {
    process.env.KONFORMUP_KARINE_TRAINER_PROFILE_ID = profileId;
    const signature = await resolveKarineTrainerSignature(profileId);
    expect(signature.signature).not.toBeNull();
    const signatureUrl = signature.signature?.src ?? null;

    const verificationQrCodeDataUrl = await QRCode.toDataURL("https://example.test/documents/ATT-TEST");
    const files = [
      ["attestation-signature.pdf", createElement(CertificateDocument, { session, candidateSession, organizationSettings: organization, trainerSignatureUrl: signatureUrl, documentRef: "ATT-TEST", verificationQrCodeDataUrl })],
      ["convocation-signature.pdf", createElement(ConvocationDocument, { session, candidateSession, organizationSettings: organization, trainerSignatureUrl: signatureUrl })],
      ["convention-signature.pdf", createElement(TrainingAgreementDocument, { agreement, organizationSettings: organization, trainerSignatureUrl: signatureUrl })]
    ] as const;

    const buffers = await Promise.all(files.map(([, document]) => renderToBuffer(document as never)));
    expect(buffers.every((buffer) => buffer.byteLength > 1000)).toBe(true);

    if (process.env.GENERATE_PDF_SIGNATURE_FIXTURES === "1") {
      const outputDirectory = path.join(process.cwd(), "tmp", "pdfs");
      await mkdir(outputDirectory, { recursive: true });
      await Promise.all(files.map(([filename], index) => writeFile(path.join(outputDirectory, filename), buffers[index])));
    }
  }, 15_000);
});
