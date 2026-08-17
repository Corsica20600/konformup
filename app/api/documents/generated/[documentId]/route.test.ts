import { describe, expect, it, vi } from "vitest";
import { AuthenticationError } from "@/lib/auth";
import { downloadStoredGeneratedDocument } from "@/lib/document-storage";
import { GET } from "./route";

vi.mock("@/lib/auth", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth")>("@/lib/auth");

  return {
    ...actual,
    assertCanAccessGeneratedDocument: vi.fn()
  };
});

vi.mock("@/lib/document-storage", () => ({
  downloadStoredGeneratedDocument: vi.fn()
}));

describe("generated document route", () => {
  it("refuses access without an authenticated user", async () => {
    const { assertCanAccessGeneratedDocument } = await import("@/lib/auth");
    vi.mocked(assertCanAccessGeneratedDocument).mockRejectedValueOnce(new AuthenticationError());

    const response = await GET(new Request("https://example.test/api/documents/generated/doc_1"), {
      params: Promise.resolve({ documentId: "doc_1" })
    });

    expect(response.status).toBe(401);
    expect(downloadStoredGeneratedDocument).not.toHaveBeenCalled();
  });
});
