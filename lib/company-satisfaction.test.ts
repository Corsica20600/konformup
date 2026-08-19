import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ createClient: vi.fn(), getInvoiceById: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createClient }));
vi.mock("@/lib/invoices", () => ({ getInvoiceById: mocks.getInvoiceById }));

import {
  buildCompanySatisfactionToken,
  companySatisfactionSubmissionSchema,
  getCompanySatisfactionPublicContext,
  getOrCreateCompanySatisfactionSurveyForInvoice,
  hashCompanySatisfactionToken,
  isCompanySatisfactionTokenFormat,
  markCompanySatisfactionDelivery,
  submitCompanySatisfaction
} from "@/lib/company-satisfaction";

const secret = "a-secure-test-secret-that-is-long-enough";
const invoice = { id: "11111111-1111-4111-8111-111111111111", company: { id: "company-1" }, quote: { id: "quote-1", session_id: "session-1" } };

describe("company satisfaction foundation", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.COMPANY_SATISFACTION_TOKEN_SECRET = secret;
  });

  it("uses a stable signed token and SHA-256 hash for idempotent invoice resends", () => {
    const first = buildCompanySatisfactionToken(invoice.id, secret);
    const second = buildCompanySatisfactionToken(invoice.id, secret);
    expect(first).toBe(second);
    expect(isCompanySatisfactionTokenFormat(first)).toBe(true);
    expect(hashCompanySatisfactionToken(first)).toHaveLength(64);
  });

  it("creates or retrieves the survey through the atomic RPC", async () => {
    const token = buildCompanySatisfactionToken(invoice.id, secret);
    mocks.getInvoiceById.mockResolvedValue(invoice);
    const rpc = vi.fn().mockResolvedValue({
      data: [{ id: "survey-1", invoice_id: invoice.id, token_hash: hashCompanySatisfactionToken(token), status: "pending", submitted_at: null }],
      error: null
    });
    mocks.createClient.mockResolvedValue({ rpc });

    const result = await getOrCreateCompanySatisfactionSurveyForInvoice(invoice.id);

    expect(rpc).toHaveBeenCalledTimes(1);
    expect(result.token).toBe(token);
    expect(result.url).toContain("/satisfaction-entreprise/");
  });

  it("returns an indistinguishable public unavailable state for malformed or unknown tokens", async () => {
    expect(await getCompanySatisfactionPublicContext("bad")).toEqual({ state: "unavailable" });
    const rpc = vi.fn().mockResolvedValue({ data: [], error: null });
    mocks.createClient.mockResolvedValue({ rpc });
    const token = buildCompanySatisfactionToken(invoice.id, secret);
    expect(await getCompanySatisfactionPublicContext(token)).toEqual({ state: "unavailable" });
  });

  it("returns only the minimal public context and never survey answers", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: [{ available: true, completed: false, company_name: "Entreprise", training_title: "SST" }], error: null });
    mocks.createClient.mockResolvedValue({ rpc });
    const result = await getCompanySatisfactionPublicContext(buildCompanySatisfactionToken(invoice.id, secret));
    expect(result).toEqual({ state: "available", companyName: "Entreprise", trainingTitle: "SST" });
  });

  it("submits once and preserves the completed outcome on a repeated submission", async () => {
    const rpc = vi.fn().mockResolvedValueOnce({ data: "submitted", error: null }).mockResolvedValueOnce({ data: "already_completed", error: null });
    mocks.createClient.mockResolvedValue({ rpc });
    const token = buildCompanySatisfactionToken(invoice.id, secret);
    const answer = { overallRating: 5, organizationRating: 4, needsRating: 5, comment: "", publicationConsent: false, publicIdentity: null };
    expect(await submitCompanySatisfaction(token, answer)).toBe("submitted");
    expect(await submitCompanySatisfaction(token, answer)).toBe("already_completed");
    expect(rpc).toHaveBeenCalledTimes(2);
  });

  it("validates ratings and rejects a public identity without consent", () => {
    expect(companySatisfactionSubmissionSchema.safeParse({ overallRating: 0, organizationRating: 4, needsRating: 5, publicationConsent: false }).success).toBe(false);
    expect(companySatisfactionSubmissionSchema.safeParse({ overallRating: 5, organizationRating: 4, needsRating: 5, publicationConsent: false, publicIdentity: "anonymous" }).success).toBe(false);
    expect(companySatisfactionSubmissionSchema.safeParse({ overallRating: 5, organizationRating: 4, needsRating: 5, publicationConsent: true, publicIdentity: "anonymous" }).success).toBe(true);
  });

  it("marks delivery only through the dedicated server RPC", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: true, error: null });
    mocks.createClient.mockResolvedValue({ rpc });
    await expect(markCompanySatisfactionDelivery("survey-1", true)).resolves.toBe(true);
    expect(rpc).toHaveBeenCalledWith("mark_company_satisfaction_delivery", { p_survey_id: "survey-1", p_success: true });
  });

  it("does not call the public submission RPC for invalid input", async () => {
    const rpc = vi.fn();
    mocks.createClient.mockResolvedValue({ rpc });
    const result = await submitCompanySatisfaction(buildCompanySatisfactionToken(invoice.id, secret), {
      overallRating: 6,
      organizationRating: 4,
      needsRating: 5,
      publicationConsent: false
    });
    expect(result).toBe("invalid");
    expect(rpc).not.toHaveBeenCalled();
  });
});
