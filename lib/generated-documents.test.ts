import { describe, expect, it } from "vitest";
import { resolveGeneratedDocumentStorageTarget } from "@/lib/generated-documents";

describe("resolveGeneratedDocumentStorageTarget", () => {
  it("stocke le livret candidat dans le bucket prive et sous la session", () => {
    expect(
      resolveGeneratedDocumentStorageTarget({
        sessionId: "session-id",
        candidateId: "candidate-id",
        type: "welcome_pack"
      })
    ).toEqual({
      bucket: "generated-documents",
      objectPath: "sessions/session-id/candidates/candidate-id/welcome-pack/livret-reglement.pdf"
    });
  });
});
