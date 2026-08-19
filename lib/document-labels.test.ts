import { describe, expect, it } from "vitest";
import { getDocumentPhase } from "@/lib/document-labels";

describe("document phases", () => {
  it("groups documents around the training lifecycle", () => {
    expect(getDocumentPhase("convocation")).toBe("before");
    expect(getDocumentPhase("feuille_presence")).toBe("during");
  });
});
