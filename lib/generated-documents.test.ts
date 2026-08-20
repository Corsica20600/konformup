import { describe, expect, it } from "vitest";
import { buildFreshPdfRequestInit, resolveGeneratedDocumentStorageTarget } from "@/lib/generated-documents";

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

describe("PDF regeneration", () => {
  it("always requests a fresh PDF before replacing the existing document object", () => {
    expect(buildFreshPdfRequestInit("session=fixture")).toEqual({
      method: "GET",
      headers: {
        Accept: "application/pdf",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
        Cookie: "session=fixture"
      },
      cache: "no-store"
    });
  });
});
