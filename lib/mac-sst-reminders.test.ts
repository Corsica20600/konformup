import { describe, expect, it } from "vitest";
import { calculateMacDates, getMacReminderEligibility, hasAmbiguousMacReminderEmail, isMacSstRemindersEnabled, normalizeReminderEmail } from "@/lib/mac-sst-reminders";

const base = { candidateId: "candidate", macIdentityId: "11111111-1111-4111-8111-111111111111", email: "candidate@example.test", validationStatus: "validated", sessionId: "session", trainingType: "sst_initial", sessionStatus: "completed", closureStatus: "closed", endDate: "2024-01-31", globalResult: "admis" };

describe("MAC SST reminders", () => {
  it("calculates 22, 23 and 24 months without losing end-of-month dates", () => {
    expect(calculateMacDates("2024-01-31")).toEqual({ firstReminderDate: "2025-11-30", secondReminderDate: "2025-12-31", expiryDate: "2026-01-31" });
  });
  it("opens the correct 22 then 23 month reminder windows", () => {
    expect(getMacReminderEligibility(base, "2025-11-30").kinds).toEqual(["month_22"]);
    expect(getMacReminderEligibility(base, "2025-12-31").kinds).toEqual(["month_23"]);
    expect(getMacReminderEligibility(base, "2026-01-31")).toMatchObject({ eligible: false, reason: "not_due" });
    expect(getMacReminderEligibility({ ...base, closureStatus: "archived" }, "2025-11-30").eligible).toBe(true);
  });
  it("excludes cancelled, incomplete, non-admitted and email-less records", () => {
    expect(getMacReminderEligibility({ ...base, sessionStatus: "cancelled" }, "2025-11-30").reason).toBe("session_incomplete");
    expect(getMacReminderEligibility({ ...base, closureStatus: "ready" }, "2025-11-30").reason).toBe("session_incomplete");
    expect(getMacReminderEligibility({ ...base, globalResult: "non_admis" }, "2025-11-30").reason).toBe("not_admitted");
    expect(getMacReminderEligibility({ ...base, email: null }, "2025-11-30").reason).toBe("no_email");
  });
  it("does not process non-SST training", () => {
    expect(getMacReminderEligibility({ ...base, trainingType: "hygiene" }, "2025-11-30").reason).toBe("not_sst");
  });
  it("requires an explicit stable identity and never falls back to an email, name or company", () => {
    expect(getMacReminderEligibility({ ...base, macIdentityId: null }, "2025-11-30")).toMatchObject({ eligible: false, reason: "identity_unverified" });
  });
  it("normalizes delivery email only and blocks shared addresses across active identities", () => {
    const identities = new Map([["shared@example.test", new Set(["identity-a", "identity-b"])]]);
    expect(normalizeReminderEmail(" Shared@Example.Test ")).toBe("shared@example.test");
    expect(hasAmbiguousMacReminderEmail("identity-a", " Shared@Example.Test ", identities)).toBe(true);
    expect(hasAmbiguousMacReminderEmail("identity-a", "changed@example.test", identities)).toBe(false);
  });
  it("does not infer a stable identity from names, companies or date-like values", () => {
    expect(getMacReminderEligibility({ ...base, macIdentityId: null, email: "same@example.test" }, "2025-11-30").reason).toBe("identity_unverified");
  });
  it("only enables the sender for the explicit true server flag", () => {
    expect(isMacSstRemindersEnabled(undefined)).toBe(false);
    expect(isMacSstRemindersEnabled("false")).toBe(false);
    expect(isMacSstRemindersEnabled("TRUE ")).toBe(true);
  });
});
