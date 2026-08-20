import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { createElement } from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { PDFDocument } from "pdf-lib";
import QRCode from "qrcode";
import { afterEach, describe, expect, it } from "vitest";
import { resolveKarineTrainerSignature } from "@/lib/document-signatures";
import { CertificateDocument, ConvocationDocument, InvoiceDocument, ProgrammeDocument, TrainingAgreementDocument } from "@/lib/pdf/documents";
import { WelcomePackDocument } from "@/lib/pdf/welcome-pack";
import type { TrainingAgreementPdfData } from "@/lib/training-agreements";
import type { InvoiceDetail } from "@/lib/invoices";
import type { QuotePdfData } from "@/lib/quotes";
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

const quote = {
  id: "55555555-5555-4555-8555-555555555555",
  quote_number: "DEV-TEST-001",
  title: session.title,
  training_type: "sst_initial",
  status: "accepted",
  company_id: candidateSession.candidate.company_id,
  price_ht: 1000,
  vat_rate: 20,
  total_ttc: 1200,
  duration_hours: 14,
  candidate_count: 8,
  location: session.location,
  session_start_date: session.start_date,
  session_end_date: session.end_date,
  prerequisites: "Aucun prerequis",
  objectives: "Prevenir les risques\nProteger et secourir",
  programme_outline: "Accueil et cadre\nPrevenir les risques\nProteger\nExaminer\nAlerter\nSecourir",
  accessibility_details: null,
  session: {
    id: session.id,
    title: session.title,
    start_date: session.start_date,
    end_date: session.end_date,
    location: session.location,
    trainer_id: session.trainer_id,
    trainer_name: session.trainer_name,
    duration_hours: session.duration_hours,
    training_type: session.training_type,
    training_family: session.training_family,
    prerequisites: session.prerequisites,
    objectives: session.objectives,
    programme_outline: session.programme_outline,
    accessibility_details: session.accessibility_details,
    mac_previous_certificate_date: null,
    mac_previous_certificate_ref: null
  },
  company: {
    id: candidateSession.candidate.company_id,
    company_name: "Entreprise test",
    legal_name: null,
    contact_first_name: "Alice",
    contact_last_name: "Martin",
    contact_email: "alice@example.test",
    contact_phone: null,
    address: "1 rue de test",
    postal_code: "20200",
    city: "Bastia",
    country: "France",
    siret: null
  }
} as unknown as QuotePdfData;

const invoice = {
  id: "66666666-6666-4666-8666-666666666666",
  invoice_number: "FAC-TEST-001",
  company_id: candidateSession.candidate.company_id,
  quote_id: quote.id,
  status: "sent",
  issue_date: "2026-08-25",
  due_date: "2026-09-25",
  notes: null,
  subtotal: 1000,
  tax_rate: 20,
  tax_amount: 200,
  total_ttc: 1200,
  created_at: "2026-08-25T00:00:00.000Z",
  company: {
    id: candidateSession.candidate.company_id,
    company_name: "Entreprise test",
    legal_name: null,
    contact_name: "Alice Martin",
    contact_email: "alice@example.test",
    contact_phone: null,
    billing_address: "1 rue de test",
    postal_code: "20200",
    city: "Bastia",
    siret: null
  },
  quote: {
    id: quote.id,
    quote_number: quote.quote_number,
    title: quote.title,
    training_type: quote.training_type,
    status: quote.status,
    session_id: session.id
  }
} as unknown as InvoiceDetail;

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
    expect((await PDFDocument.load(buffers[0])).getPageCount()).toBe(1);

    const unsignedBuffers = await Promise.all(
      [
        createElement(CertificateDocument, { session, candidateSession, organizationSettings: organization, documentRef: "ATT-TEST", verificationQrCodeDataUrl }),
        createElement(ConvocationDocument, { session, candidateSession, organizationSettings: organization }),
        createElement(TrainingAgreementDocument, { agreement, organizationSettings: organization })
      ].map((document) => renderToBuffer(document as never))
    );

    for (const [index, buffer] of buffers.entries()) {
      expect(buffer.byteLength).toBeGreaterThan(unsignedBuffers[index].byteLength);
    }

    if (process.env.GENERATE_PDF_SIGNATURE_FIXTURES === "1") {
      const outputDirectory = path.join(process.cwd(), "tmp", "pdfs");
      await mkdir(outputDirectory, { recursive: true });
      await Promise.all(files.map(([filename], index) => writeFile(path.join(outputDirectory, filename), buffers[index])));
    }
  }, 15_000);

  it("does not inject Karine's signature when the assigned trainer is absent or different", async () => {
    process.env.KONFORMUP_KARINE_TRAINER_PROFILE_ID = profileId;

    await expect(resolveKarineTrainerSignature(null)).resolves.toEqual({
      signature: null,
      reason: "no_assigned_profile"
    });
    await expect(resolveKarineTrainerSignature("00000000-0000-4000-8000-000000000043")).resolves.toEqual({
      signature: null,
      reason: "different_trainer"
    });
  });

  it("keeps the compact document layouts on their intended pages", async () => {
    const files = [
      ["invoice-pagination.pdf", createElement(InvoiceDocument, { invoice, organizationSettings: organization }), 1],
      ["programme-pagination.pdf", createElement(ProgrammeDocument, { quote, organizationSettings: organization }), 2],
      [
        "welcome-pack-pagination.pdf",
        createElement(WelcomePackDocument, {
          session,
          candidateSession,
          organizationSettings: organization,
          programmeLines: ["Accueil", "Prevention", "Mises en situation"]
        }),
        3
      ]
    ] as const;

    const buffers = await Promise.all(files.map(([, document]) => renderToBuffer(document as never)));
    for (const [index, buffer] of buffers.entries()) {
      const pdf = await PDFDocument.load(buffer);
      expect(pdf.getPageCount(), files[index][0]).toBe(files[index][2]);
    }

    if (process.env.GENERATE_PDF_SIGNATURE_FIXTURES === "1") {
      const outputDirectory = path.join(process.cwd(), "tmp", "pdfs");
      await mkdir(outputDirectory, { recursive: true });
      await Promise.all(files.map(([filename], index) => writeFile(path.join(outputDirectory, filename), buffers[index])));
    }
  }, 15_000);
});
