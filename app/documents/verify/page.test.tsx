import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import VerifyDocumentPage from "./page";

const supabaseMocks = vi.hoisted(() => ({
  rpc: vi.fn(),
  maybeSingle: vi.fn()
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    rpc: supabaseMocks.rpc
  }))
}));

describe("public document verification page", () => {
  beforeEach(() => {
    vi.stubGlobal("React", React);
    supabaseMocks.maybeSingle.mockReset();
    supabaseMocks.rpc.mockReset();
    supabaseMocks.rpc.mockReturnValue({ maybeSingle: supabaseMocks.maybeSingle });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders only minimal non-sensitive fields for a valid reference", async () => {
    supabaseMocks.maybeSingle.mockResolvedValue({
      data: {
        document_ref: "ATTEST-2026-001",
        document_type: "attestation",
        status: "generated",
        created_at: "2026-08-17T10:00:00.000Z"
      }
    });

    const page = await VerifyDocumentPage({
      searchParams: Promise.resolve({ ref: "ATTEST-2026-001" })
    });
    const html = renderToStaticMarkup(page);

    expect(supabaseMocks.rpc).toHaveBeenCalledWith("verify_generated_document", {
      p_ref: "ATTEST-2026-001"
    });
    expect(html).toContain("Document verifie");
    expect(html).toContain("ATTEST-2026-001");
    expect(html).toContain("%2Fbrand%2Fkonformup-logo.png");
    expect(html).not.toContain("candidate_name");
    expect(html).not.toContain("candidate_email");
    expect(html).not.toContain("storage_path");
    expect(html).not.toContain("metadata");
  });

  it("renders an unobtrusive not-found state for an invalid reference", async () => {
    supabaseMocks.maybeSingle.mockResolvedValue({ data: null });

    const page = await VerifyDocumentPage({
      searchParams: Promise.resolve({ ref: "UNKNOWN" })
    });
    const html = renderToStaticMarkup(page);

    expect(html).toContain("Document introuvable");
    expect(html).not.toContain("Document verifie");
  });
});
