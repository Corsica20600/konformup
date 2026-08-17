import { describe, expect, it } from "vitest";
import { getPdfOrganizationFooterLine } from "@/lib/pdf/organization-branding";
import { PUBLIC_CONTACT_EMAIL, PUBLIC_SITE_ORIGIN } from "@/lib/public-config";
import type { OrganizationBranding } from "@/lib/types";

describe("PDF organization branding", () => {
  it("uses the confirmed public contact details", () => {
    const footer = getPdfOrganizationFooterLine({
      organization_name: "Konform’up",
      contact_email: PUBLIC_CONTACT_EMAIL,
      contact_phone: "01 02 03 04 05"
    } as OrganizationBranding);

    expect(footer).toContain(PUBLIC_CONTACT_EMAIL);
    expect(footer).toContain(PUBLIC_SITE_ORIGIN);
    expect(footer).not.toContain("app.konformup.com");
  });
});
