import { describe, expect, it } from "vitest";
import { getDefaultSessionTitle, getDefaultTrainerId } from "@/lib/session-form";

describe("session form defaults", () => {
  it("selects the first registered trainer when available", () => {
    expect(
      getDefaultTrainerId([
        { id: "trainer-1", first_name: "Karine", last_name: "Vannucci", email: null, phone: null }
      ])
    ).toBe("trainer-1");
    expect(getDefaultTrainerId([])).toBe("");
  });

  it("uses safe titles for every training type", () => {
    expect(getDefaultSessionTitle("sst_initial")).toBe("Formation SST initiale");
    expect(getDefaultSessionTitle("mac_sst")).toBe("MAC SST");
    expect(getDefaultSessionTitle("hygiene")).toBe("Formation Hygiène");
    expect(getDefaultSessionTitle("hygiene")).not.toMatch(/SST|FORPREV/i);
  });
});
