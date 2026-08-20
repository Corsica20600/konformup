import { beforeEach, describe, expect, it, vi } from "vitest";

const { link, merge } = vi.hoisted(() => ({ link: vi.fn(), merge: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/mac-identities", () => ({ linkCandidateToMacIdentity: link, mergeMacIdentities: merge }));

import { linkCandidateMacIdentityAction, mergeMacIdentitiesAction } from "@/app/(dashboard)/candidates/actions";

const candidateId = "11111111-1111-4111-8111-111111111111";
const identityId = "22222222-2222-4222-8222-222222222222";

function data(values: Record<string, string>) { const form = new FormData(); Object.entries(values).forEach(([key, value]) => form.set(key, value)); return form; }

describe("MAC identity administrative confirmations", () => {
  beforeEach(() => vi.clearAllMocks());

  it("does not link a dossier before an explicit confirmation", async () => {
    const result = await linkCandidateMacIdentityAction({}, data({ candidateId, identityId, reason: "Dossier vérifié" }));
    expect(result.error).toContain("confirmation");
    expect(link).not.toHaveBeenCalled();
  });

  it("does not merge identities before an explicit confirmation", async () => {
    const result = await mergeMacIdentitiesAction({}, data({ candidateId, canonicalIdentityId: identityId, secondaryIdentityId: candidateId, reason: "Historique vérifié" }));
    expect(result.error).toContain("confirmation");
    expect(merge).not.toHaveBeenCalled();
  });
});
