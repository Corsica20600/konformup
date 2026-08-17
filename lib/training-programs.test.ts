import { describe, expect, it } from "vitest";
import { buildDefaultQuoteTitle } from "@/lib/quote-utils";
import {
  getTrainingDocumentTitle,
  getTrainingProgramDefaults,
  getTrainingTypeLabel,
  normalizeTrainingType
} from "@/lib/training-programs";

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

  it("uses a neutral Hygiene title across quote, programme and completion documents", () => {
    const documentTitles = [
      getTrainingDocumentTitle("hygiene", "Formation SST - Nouvelle prestation"),
      getTrainingDocumentTitle("hygiene", "Formation SST - Prestation de formation"),
      getTrainingDocumentTitle("hygiene", "Programme FORPREV")
    ];

    expect(documentTitles).toEqual(["Formation Hygiène", "Formation Hygiène", "Formation Hygiène"]);
    expect(documentTitles.join(" ")).not.toMatch(/SST|FORPREV/i);
    expect(buildDefaultQuoteTitle("Nouvelle prestation", "hygiene")).toBe("Formation Hygiène");
  });

  it("keeps precise custom titles", () => {
    expect(getTrainingDocumentTitle("hygiene", "Hygiène alimentaire en restauration")).toBe(
      "Hygiène alimentaire en restauration"
    );
  });

  it("uses the expected SST initial and MAC SST fallbacks", () => {
    expect(getTrainingDocumentTitle("sst_initial", "Formation SST - Nouvelle prestation")).toBe(
      "Formation SST initiale"
    );
    expect(getTrainingDocumentTitle("mac_sst", "Formation SST - Nouvelle prestation")).toBe("MAC SST");
    expect(getTrainingDocumentTitle("mac_sst", "Formation Hygiène")).toBe("MAC SST");
  });
});
