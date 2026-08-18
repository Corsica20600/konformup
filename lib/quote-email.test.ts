import { describe, expect, it } from "vitest";
import { buildQuoteEmailBody, buildQuoteEmailHtml } from "./quote-email";
import type { QuoteEditData } from "./quotes";

const quote = { id: "quote-id", quote_number: "DEV-2026-01", title: "<Formation>", training_type: "sst_initial", status: "draft", company: { contact_email: "client@example.test", contact_name: "Client", company_name: "Entreprise" } } as unknown as QuoteEditData;
const url = "https://app.example.test/analyse-besoins/public-token";

describe("quote analysis email content", () => {
  it("includes the analysis CTA and fallback URL", () => {
    const body = buildQuoteEmailBody(quote, ["Cordialement"], url);
    expect(body).toContain("Analyse de vos besoins"); expect(body).toContain("Completer l'analyse des besoins"); expect(body).toContain(url);
  });
  it("escapes dynamic quote data in the HTML block", () => {
    const html = buildQuoteEmailHtml(quote, url);
    expect(html).toContain("&lt;Formation&gt;"); expect(html).toContain(`href="${url}"`); expect(html).not.toContain("token_hash");
  });
});
