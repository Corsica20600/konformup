import { describe, expect, it } from "vitest";
import { createCandidateSchema, createQuoteSchema, createSessionSchema } from "@/lib/validation";

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

  it("accepts selectable training dates and a registered trainer on a quote", () => {
    const result = createQuoteSchema.parse({
      ...baseQuote,
      trainingType: "sst_initial",
      sessionStartDate: "2026-09-10",
      sessionEndDate: "2026-09-11",
      location: "Ajaccio",
      trainerId: "00000000-0000-4000-8000-000000000020"
    });

    expect(result.sessionStartDate).toBe("2026-09-10");
    expect(result.sessionEndDate).toBe("2026-09-11");
    expect(result.trainerId).toBe("00000000-0000-4000-8000-000000000020");
  });

  it("rejects an incomplete or reversed quote date range", () => {
    const missingEndDate = createQuoteSchema.safeParse({
      ...baseQuote,
      trainingType: "sst_initial",
      sessionStartDate: "2026-09-10",
      sessionEndDate: ""
    });
    const reversedRange = createQuoteSchema.safeParse({
      ...baseQuote,
      trainingType: "sst_initial",
      sessionStartDate: "2026-09-11",
      sessionEndDate: "2026-09-10"
    });

    expect(missingEndDate.success).toBe(false);
    expect(reversedRange.success).toBe(false);
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

  it("accepts the compact session candidate form with hidden optional fields", () => {
    const result = createCandidateSchema.parse({
      sessionId: "00000000-0000-4000-8000-000000000010",
      companyId: "00000000-0000-4000-8000-000000000001",
      firstName: "Jean",
      lastName: "Dupont",
      email: "",
      phone: "",
      jobTitle: "",
      company: null,
      address: null,
      postalCode: null,
      city: null,
      validationStatus: "pending"
    });

    expect(result.company).toBe("");
    expect(result.address).toBe("");
    expect(result.postalCode).toBe("");
    expect(result.city).toBe("");
  });
});
