import { describe, expect, it } from "vitest";
import {
  PRIVATE_APP_ORIGIN,
  PUBLIC_SITE_ORIGIN,
  buildPrivateAppUrl,
  resolvePrivateAppOrigin,
  resolvePublicSiteOrigin
} from "@/lib/public-config";

describe("public URL configuration", () => {
  it("uses the Konformup public and private domains by default", () => {
    expect(resolvePublicSiteOrigin({})).toBe(PUBLIC_SITE_ORIGIN);
    expect(resolvePrivateAppOrigin({})).toBe(PRIVATE_APP_ORIGIN);
  });

  it("never uses the public website for a private application route", () => {
    const environment = {
      NEXT_PUBLIC_SITE_URL: "https://www.konformup.com",
      NEXT_PUBLIC_APP_URL: "https://app.konformup.com"
    };

    expect(buildPrivateAppUrl("/documents/verify?ref=ATTEST-2026-001", environment).toString()).toBe(
      "https://app.konformup.com/documents/verify?ref=ATTEST-2026-001"
    );
    expect(buildPrivateAppUrl("/attendance/respond?token=test-token", environment).origin).toBe(
      "https://app.konformup.com"
    );
  });

  it("keeps general organization links on the public website", () => {
    expect(resolvePublicSiteOrigin({ NEXT_PUBLIC_SITE_URL: "https://www.konformup.com/contact" })).toBe(
      "https://www.konformup.com"
    );
  });
});
