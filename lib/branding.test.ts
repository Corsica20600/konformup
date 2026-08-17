import { describe, expect, it } from "vitest";
import { APP_BRANDING } from "@/lib/branding";
import { normalizeOrganizationLogoPath, PRIMARY_BRAND_LOGO_PATH } from "@/lib/brand-assets";

describe("application branding", () => {
  it("uses the Konform'up identity across all supported training families", () => {
    expect(APP_BRANDING.name).toBe("Konform’up");
    expect(APP_BRANDING.baseline).toContain("SST");
    expect(APP_BRANDING.baseline).toContain("Hygiène");
    expect(APP_BRANDING.dashboardTitle).toBe("Tableau de bord");
    expect(APP_BRANDING.logoPath).toBe(PRIMARY_BRAND_LOGO_PATH);
    expect(APP_BRANDING.logoPath).toBe("/brand/konformup-logo.png");
  });

  it("redirects legacy organization logo paths to the primary asset", () => {
    expect(normalizeOrganizationLogoPath("/logo-organisme.png")).toBe(PRIMARY_BRAND_LOGO_PATH);
    expect(normalizeOrganizationLogoPath("/logo.jpg")).toBe(PRIMARY_BRAND_LOGO_PATH);
    expect(normalizeOrganizationLogoPath("/konformup-app-logo.png")).toBe(PRIMARY_BRAND_LOGO_PATH);
  });
});
