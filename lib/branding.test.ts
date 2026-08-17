import { describe, expect, it } from "vitest";
import { APP_BRANDING } from "@/lib/branding";

describe("application branding", () => {
  it("uses the Konform'up identity across all supported training families", () => {
    expect(APP_BRANDING.name).toBe("Konform’up");
    expect(APP_BRANDING.baseline).toContain("SST");
    expect(APP_BRANDING.baseline).toContain("Hygiène");
    expect(APP_BRANDING.dashboardTitle).toBe("Tableau de bord");
  });
});
