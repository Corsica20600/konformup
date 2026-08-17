import { describe, expect, it } from "vitest";
import { createQuoteSchema, createSessionSchema } from "@/lib/validation";

const baseQuote = {
  sessionId: "",
  companyId: "00000000-0000-4000-8000-000000000001",
  title: "Formation de test",
  description: "",
  durationHours: "14",
  prerequisites: "",
  objectives: "",
  programmeOutline: "",
  accessibilityDetails: "",
  candidateCount: "1",
  priceHt: "100",
  vatRate: "20",
  notes: ""
};

describe("training form validation", () => {
  it.each(["sst_initial", "hygiene"] as const)(
    "accepts a %s quote without MAC fields",
    (trainingType) => {
      const result = createQuoteSchema.parse({
        ...baseQuote,
        trainingType,
        macPreviousCertificateDate: null,
        macPreviousCertificateRef: undefined
      });

      expect(result.macPreviousCertificateDate).toBe("");
      expect(result.macPreviousCertificateRef).toBe("");
    }
  );

  it("accepts a MAC SST quote with empty or populated certificate fields", () => {
    const empty = createQuoteSchema.parse({
      ...baseQuote,
      trainingType: "mac_sst",
      macPreviousCertificateDate: null,
      macPreviousCertificateRef: ""
    });
    const populated = createQuoteSchema.parse({
      ...baseQuote,
      trainingType: "mac_sst",
      macPreviousCertificateDate: "2024-09-01",
      macPreviousCertificateRef: "SST-2024-001"
    });

    expect(empty.macPreviousCertificateDate).toBe("");
    expect(empty.macPreviousCertificateRef).toBe("");
    expect(populated.macPreviousCertificateDate).toBe("2024-09-01");
    expect(populated.macPreviousCertificateRef).toBe("SST-2024-001");
  });

  it("normalizes missing MAC fields for session creation", () => {
    const result = createSessionSchema.parse({
      title: "Session SST initiale",
      startDate: "2026-09-01",
      endDate: "2026-09-02",
      location: "Centre de test",
      trainingType: "sst_initial",
      status: "draft",
      macPreviousCertificateDate: null,
      macPreviousCertificateRef: undefined
    });

    expect(result.macPreviousCertificateDate).toBe("");
    expect(result.macPreviousCertificateRef).toBe("");
  });
});
