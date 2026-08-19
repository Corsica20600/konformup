import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  fetchExistingPdf: vi.fn(),
  getInvoiceComplaintByInvoiceId: vi.fn(),
  markInvoiceComplaintSentWithInvoice: vi.fn(),
  getTransactionalEmailContext: vi.fn(),
  sendBrevoTransactionalEmail: vi.fn(),
  getOrCreateCompanySatisfactionSurveyForInvoice: vi.fn(),
  markCompanySatisfactionDelivery: vi.fn()
}));

vi.mock("@/lib/generated-documents", () => ({ fetchExistingPdf: mocks.fetchExistingPdf }));
vi.mock("@/lib/invoice-complaints", () => ({
  getInvoiceComplaintByInvoiceId: mocks.getInvoiceComplaintByInvoiceId,
  markInvoiceComplaintSentWithInvoice: mocks.markInvoiceComplaintSentWithInvoice
}));
vi.mock("@/lib/email-config", () => ({
  getTransactionalEmailContext: mocks.getTransactionalEmailContext,
  sendBrevoTransactionalEmail: mocks.sendBrevoTransactionalEmail
}));
vi.mock("@/lib/company-satisfaction", () => ({
  getOrCreateCompanySatisfactionSurveyForInvoice: mocks.getOrCreateCompanySatisfactionSurveyForInvoice,
  markCompanySatisfactionDelivery: mocks.markCompanySatisfactionDelivery
}));

import { sendInvoiceEmail } from "@/lib/invoice-email";

const invoice = {
  id: "invoice-1",
  invoice_number: "FACT-2026-001",
  company: { id: "company-1", company_name: "Entreprise", contact_email: "client@example.test" },
  quote: { id: "quote-1", quote_number: "DEV-2026-001", title: "SST", training_type: "sst_initial" }
};

function pdf(content = "%PDF-1.4") {
  return { buffer: new TextEncoder().encode(content).buffer, contentType: "application/pdf" };
}

describe("sendInvoiceEmail", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.getTransactionalEmailContext.mockResolvedValue({ signatureLines: ["Konform'up"] });
    mocks.sendBrevoTransactionalEmail.mockResolvedValue(undefined);
    mocks.markInvoiceComplaintSentWithInvoice.mockResolvedValue(undefined);
    mocks.markCompanySatisfactionDelivery.mockResolvedValue(true);
  });

  it("sends only the invoice when the complaint option is disabled", async () => {
    mocks.getInvoiceComplaintByInvoiceId.mockResolvedValue({ send_with_invoice: false });
    mocks.fetchExistingPdf.mockResolvedValue(pdf());

    const result = await sendInvoiceEmail(invoice as never);

    expect(mocks.sendBrevoTransactionalEmail).toHaveBeenCalledTimes(1);
    expect(mocks.sendBrevoTransactionalEmail.mock.calls[0]?.[0].attachment).toHaveLength(1);
    expect(result.complaintAttached).toBe(false);
    expect(mocks.markInvoiceComplaintSentWithInvoice).not.toHaveBeenCalled();
  });

  it("sends the non-empty invoice and complaint PDFs in one Brevo payload", async () => {
    mocks.getInvoiceComplaintByInvoiceId.mockResolvedValue({ send_with_invoice: true });
    mocks.fetchExistingPdf.mockResolvedValueOnce(pdf("%PDF invoice")).mockResolvedValueOnce(pdf("%PDF complaint"));

    const result = await sendInvoiceEmail(invoice as never);

    expect(mocks.sendBrevoTransactionalEmail).toHaveBeenCalledTimes(1);
    const payload = mocks.sendBrevoTransactionalEmail.mock.calls[0]?.[0];
    expect(payload.attachment).toHaveLength(2);
    expect(payload.attachment.map((attachment: { name: string }) => attachment.name)).toEqual([
      "facture-FACT-2026-001.pdf",
      "fiche-reclamation-FACT-2026-001.pdf"
    ]);
    expect(payload.attachment.every((attachment: { content: string }) => attachment.content.length > 0)).toBe(true);
    expect(result.complaintAttached).toBe(true);
    expect(mocks.markInvoiceComplaintSentWithInvoice).toHaveBeenCalledWith("invoice-1");
  });

  it("does not mark the complaint as sent when Brevo rejects the payload", async () => {
    mocks.getInvoiceComplaintByInvoiceId.mockResolvedValue({ send_with_invoice: true });
    mocks.fetchExistingPdf.mockResolvedValue(pdf());
    mocks.sendBrevoTransactionalEmail.mockRejectedValue(new Error("Brevo indisponible"));

    await expect(sendInvoiceEmail(invoice as never)).rejects.toThrow("Brevo indisponible");

    expect(mocks.sendBrevoTransactionalEmail).toHaveBeenCalledTimes(1);
    expect(mocks.markInvoiceComplaintSentWithInvoice).not.toHaveBeenCalled();
  });

  it("includes the same reusable satisfaction link in the one Brevo email and marks it sent after success", async () => {
    mocks.getInvoiceComplaintByInvoiceId.mockResolvedValue({ send_with_invoice: false });
    mocks.fetchExistingPdf.mockResolvedValue(pdf());
    mocks.getOrCreateCompanySatisfactionSurveyForInvoice.mockResolvedValue({ surveyId: "survey-1", submittedAt: null, url: "https://app.test/satisfaction-entreprise/token" });

    await sendInvoiceEmail({ ...invoice, send_company_satisfaction: true } as never);

    expect(mocks.sendBrevoTransactionalEmail).toHaveBeenCalledTimes(1);
    const payload = mocks.sendBrevoTransactionalEmail.mock.calls[0]?.[0];
    expect(payload.textContent).toContain("https://app.test/satisfaction-entreprise/token");
    expect(payload.htmlContent).toContain("Donner mon avis");
    expect(mocks.markCompanySatisfactionDelivery).toHaveBeenCalledWith("survey-1", true);
  });

  it("marks delivery_error after a failed Brevo attempt without sending a second email", async () => {
    mocks.getInvoiceComplaintByInvoiceId.mockResolvedValue({ send_with_invoice: false });
    mocks.fetchExistingPdf.mockResolvedValue(pdf());
    mocks.getOrCreateCompanySatisfactionSurveyForInvoice.mockResolvedValue({ surveyId: "survey-1", submittedAt: null, url: "https://app.test/satisfaction-entreprise/token" });
    mocks.sendBrevoTransactionalEmail.mockRejectedValue(new Error("Brevo indisponible"));

    await expect(sendInvoiceEmail({ ...invoice, send_company_satisfaction: true } as never)).rejects.toThrow("Brevo indisponible");
    expect(mocks.sendBrevoTransactionalEmail).toHaveBeenCalledTimes(1);
    expect(mocks.markCompanySatisfactionDelivery).toHaveBeenCalledWith("survey-1", false);
  });
});
