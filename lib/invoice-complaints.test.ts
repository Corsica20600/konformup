import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ createClient: vi.fn() }));

vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createClient }));

import { setInvoiceComplaintSendWithInvoice } from "@/lib/invoice-complaints";

const invoice = {
  id: "invoice-1",
  company: { id: "company-1" },
  quote: { id: "quote-1" }
} as never;

describe("setInvoiceComplaintSendWithInvoice", () => {
  const existingComplaint = {
    id: "complaint-1",
    status: "in_progress",
    severity: "major",
    dissatisfaction_summary: "Synthèse existante",
    root_cause: "Cause existante",
    corrective_actions: "Mesure existante"
  };

  beforeEach(() => vi.resetAllMocks());

  it.each([true, false])("updates only send_with_invoice to %s without overwriting the complaint", async (value) => {
    let updatePayload: Record<string, unknown> | null = null;
    const update = vi.fn((payload: Record<string, unknown>) => {
      updatePayload = payload;
      return { eq: vi.fn(() => ({ error: null })) };
    });
    const select = vi.fn(() => ({ eq: vi.fn(() => ({ maybeSingle: vi.fn().mockResolvedValue({ data: existingComplaint, error: null }) })) }));
    mocks.createClient.mockResolvedValue({ from: vi.fn(() => ({ select, update })) });

    await setInvoiceComplaintSendWithInvoice(invoice, value);

    expect(update).toHaveBeenCalledWith({ send_with_invoice: value });
    expect(updatePayload).not.toHaveProperty("status");
    expect(updatePayload).not.toHaveProperty("dissatisfaction_summary");
    expect(existingComplaint).toMatchObject({
      status: "in_progress",
      severity: "major",
      dissatisfaction_summary: "Synthèse existante",
      root_cause: "Cause existante",
      corrective_actions: "Mesure existante"
    });
  });
});
