import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { EditQuoteForm, getLinkedQuoteDocuments } from "./edit-quote-form";
import type { QuoteEditData } from "@/lib/quotes";

const quote = {
  id: "quote-1",
  quote_number: "DEV-2026-001",
  title: "Formation SST initiale",
  training_type: "sst_initial",
  status: "accepted",
  company: { id: "company-1", company_name: "Entreprise test" },
  session_id: "session-1",
  trainer_name: null,
  mac_previous_certificate_date: null,
  mac_previous_certificate_ref: null,
  duration_hours: 14,
  prerequisites: null,
  objectives: null,
  programme_outline: null,
  accessibility_details: null,
  price_ht: 1000,
  vat_rate: 20,
  candidate_count: 4,
  session_start_date: null,
  session_end_date: null,
  location: null,
  description: null,
  notes: null
} as unknown as QuoteEditData;

describe("quote action bar", () => {
  it("keeps one linked-document entry per available document", () => {
    expect(
      getLinkedQuoteDocuments({
        invoiceId: "invoice-1",
        programmeFileUrl: "/api/documents/generated/programme-1",
        trainingAgreementFileUrl: "/api/documents/generated/convention-1"
      })
    ).toEqual([
      { key: "invoice", label: "Ouvrir la facture", href: "/invoices/invoice-1", external: false },
      { key: "programme", label: "Ouvrir le programme", href: "/api/documents/generated/programme-1", external: true },
      { key: "training-agreement", label: "Ouvrir la convention", href: "/api/documents/generated/convention-1", external: true }
    ]);
    expect(getLinkedQuoteDocuments({ invoiceId: null, programmeFileUrl: null, trainingAgreementFileUrl: null })).toEqual([]);
  });

  it("puts the current quote PDF and delivery action first without the former duplicate buttons", () => {
    const markup = renderToStaticMarkup(
      <EditQuoteForm
        quote={quote}
        invoice={{ id: "invoice-1", invoice_number: "FAC-2026-001" }}
        programmeFileUrl="/api/documents/generated/programme-1"
        trainingAgreement={{ id: "agreement-1", fileUrl: "/api/documents/generated/convention-1", documentRef: "CONV-2026-001", version: 1, missingFields: [] }}
        trainers={[]}
      />
    );

    expect(markup).toContain("Voir le devis");
    expect(markup).toContain('href="/api/pdf/quote/quote-1"');
    expect(markup).toContain("Envoyer le devis");
    expect(markup).toContain("Ouvrir la session");
    expect(markup).toContain("Documents liés");
    expect(markup).toContain(">Plus<");
    expect(markup).toContain(">Ouvrir<");
    expect(markup).toContain(">Telecharger<");
    expect(markup).toContain(">Regenerer<");
    expect(markup).not.toContain(">Voir la facture<");
    expect(markup).not.toContain(">PDF facture<");
    expect(markup).not.toContain(">Ouvrir le PDF<");
  });

  it("does not offer an unavailable session as a primary action", () => {
    const markup = renderToStaticMarkup(
      <EditQuoteForm quote={{ ...quote, session_id: null }} invoice={null} programmeFileUrl={null} trainingAgreement={null} trainers={[]} />
    );

    expect(markup).not.toContain("Ouvrir la session");
    expect(markup).toContain("Documents liés");
  });
});
