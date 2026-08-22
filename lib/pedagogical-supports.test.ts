import { describe, expect, it } from "vitest";
import { DUERP_KONFORMUP_SUPPORT_SLUG, getPedagogicalSupport, getPedagogicalSupportUrl } from "@/lib/pedagogical-supports";

describe("pedagogical supports", () => {
  it("maps the DUERP support to the private Supabase object", () => {
    expect(getPedagogicalSupport(DUERP_KONFORMUP_SUPPORT_SLUG)).toMatchObject({
      storageBucket: "shared-training-resources",
      storagePath: "pedagogical-supports/duerp-konformup/v1.pdf",
      fileName: "DUERP_Konformup.pdf"
    });
  });

  it("does not expose an arbitrary support path", () => {
    expect(getPedagogicalSupport("unknown")).toBeNull();
    expect(getPedagogicalSupportUrl(DUERP_KONFORMUP_SUPPORT_SLUG)).toBe("/api/training-supports/duerp-konformup");
  });
});
