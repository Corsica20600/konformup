import { describe, expect, it } from "vitest";
import { buildQuoteEmailBody, buildQuoteEmailHtml } from "./quote-email";
import type { QuoteEditData } from "./quotes";

const quote = { id: "quote-id", quote_number: "DEV-2026-01", title: "<Formation>", training_type: "sst_initial", status: "draft", company: { contact_email: "client@example.test", contact_name: "Client", company_name: "Entreprise" } } as unknown as QuoteEditData;
describe("quote email content", () => {
  it("does not include the needs-analysis link", () => {
    const body = buildQuoteEmailBody(quote, ["Cordialement"]);
    expect(body).toContain("Veuillez trouver ci-joint notre devis");
    expect(body).not.toContain("Analyse de vos besoins");
  });
  it("escapes dynamic quote data in the HTML", () => {
    const html = buildQuoteEmailHtml(quote);
    expect(html).toContain("&lt;Formation&gt;"); expect(html).not.toContain("analyse-besoins");
  });
});
