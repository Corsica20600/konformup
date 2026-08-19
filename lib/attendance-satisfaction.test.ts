import { describe, expect, it } from "vitest";
import { resolveCandidateSatisfactionSubmissionOutcome } from "@/lib/attendance";

describe("candidate satisfaction finalisation", () => {
  it("maps the first successful insert to submitted", () => {
    expect(resolveCandidateSatisfactionSubmissionOutcome(true)).toBe("submitted");
  });

  it("maps the unique-conflict no-op to already completed without exposing data", () => {
    expect(resolveCandidateSatisfactionSubmissionOutcome(false)).toBe("already_completed");
  });
});
