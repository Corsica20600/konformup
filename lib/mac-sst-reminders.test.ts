import { describe, expect, it } from "vitest";
import { calculateMacDates, getMacReminderEligibility } from "@/lib/mac-sst-reminders";

const base = { candidateId: "candidate", email: "candidate@example.test", validationStatus: "validated", sessionId: "session", trainingType: "sst_initial", sessionStatus: "completed", closureStatus: "closed", endDate: "2024-01-31", globalResult: "admis" };

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
});
