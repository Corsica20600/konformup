import { describe, expect, it } from "vitest";
import { isMacIdentitySuggestion, macIdentityOptionLabel, selectableMacIdentities, type MacIdentityOption } from "@/lib/mac-identity-presentation";

const currentId = "11111111-1111-4111-8111-111111111111";
const option = (overrides: Partial<MacIdentityOption> = {}): MacIdentityOption => ({
  id: "22222222-2222-4222-8222-222222f86f3e",
  status: "active",
  candidateNames: ["Tatiana Messina"],
  candidateEmail: "tatiana@email.fr",
  company: "Bijouterie Vannucci",
  latestSession: { title: "Formation SST initiale", endDate: "2026-08-25", trainingType: "sst_initial" },
  candidateCount: 1,
  ...overrides
});

describe("MAC identity selection presentation", () => {
  it("uses a distinct useful label instead of a creation date", () => {
    const label = macIdentityOptionLabel(option());
    expect(label).toContain("Tatiana Messina");
    expect(label).toContain("tatiana@email.fr");
    expect(label).toContain("Bijouterie Vannucci");
    expect(label).toContain("Formation SST initiale — SST initiale 25/08/2026");
    expect(label).toContain("1 dossier");
    expect(label).toContain("…f86f3e");
  });

  it("keeps missing information explicit and an UUID suffix decisive", () => {
    const label = macIdentityOptionLabel(option({ candidateNames: [], candidateEmail: null, company: null, latestSession: null, candidateCount: 2, id: "33333333-3333-4333-8333-333333abcdef" }));
    expect(label).toContain("Non renseigné");
    expect(label).toContain("2 dossiers");
    expect(label).toContain("…abcdef");
  });

  it("excludes the current and merged identities without selecting another one", () => {
    const choices = selectableMacIdentities([
      option({ id: currentId }),
      option({ id: "33333333-3333-4333-8333-333333333333", status: "merged" }),
      option()
    ], currentId, "");
    expect(choices).toEqual([option()]);
  });

  it("searches the explicit fields and only flags suggestions visually", () => {
    expect(selectableMacIdentities([option()], null, "vannucci")).toHaveLength(1);
    expect(selectableMacIdentities([option()], null, "inconnu")).toHaveLength(0);
    expect(isMacIdentitySuggestion(option(), { name: "Autre personne", email: "tatiana@email.fr" })).toContain("Même email");
    expect(isMacIdentitySuggestion(option(), { name: "Tatiana Messina", email: null })).toContain("Même nom");
  });
});
