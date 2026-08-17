import { describe, expect, it } from "vitest";
import { getTrainingProgramDefaults, getTrainingTypeLabel, normalizeTrainingType } from "@/lib/training-programs";

describe("training program helpers", () => {
  it("normalizes unknown training types to SST initial", () => {
    expect(normalizeTrainingType("unknown")).toBe("sst_initial");
    expect(getTrainingTypeLabel("unknown")).toBe("SST initiale");
  });

  it("provides MAC SST documentary defaults", () => {
    const defaults = getTrainingProgramDefaults("mac_sst");

    expect(defaults.durationHours).toBe(7);
    expect(defaults.prerequisites).toContain("certificat SST");
    expect(defaults.programmeLines.join(" ")).toContain("Actualisation");
  });
});
