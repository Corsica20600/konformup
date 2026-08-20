import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MacIdentityPanel } from "@/components/candidates/mac-identity-panel";

const identity = { id: "11111111-1111-4111-8111-111111111111", status: "active" as const, mergedIntoIdentityId: null, verifiedAt: null, candidateCount: 2, operations: [], sessions: [{ id: "session-1", title: "SST initiale", endDate: "2026-08-25", trainingType: "sst_initial" }], macDueDate: null };
const availableIdentities = [
  { id: identity.id, status: "active" as const, candidateNames: ["Identité actuelle"], candidateEmail: "current@example.test", company: "Entreprise", latestSession: null, candidateCount: 1 },
  { id: "22222222-2222-4222-8222-222222f86f3e", status: "active" as const, candidateNames: ["Tatiana Messina"], candidateEmail: "tatiana@email.fr", company: "Bijouterie Vannucci", latestSession: { title: "Formation SST initiale", endDate: "2026-08-25", trainingType: "sst_initial" }, candidateCount: 1 },
  { id: "33333333-3333-4333-8333-333333abcdef", status: "merged" as const, candidateNames: ["Ancienne identité"], candidateEmail: null, company: null, latestSession: null, candidateCount: 1 }
];

describe("MacIdentityPanel", () => {
  it("does not expose administrative mutations to a non-admin", () => {
    const html = renderToStaticMarkup(<MacIdentityPanel candidateId="candidate-1" candidateName="Alice Martin" candidateEmail="alice@example.test" identity={identity} availableIdentities={availableIdentities} isAdmin={false} />);
    expect(html).not.toContain("Gérer l’identité MAC");
  });

  it("starts without a selected identity or confirmation and explains both operations", () => {
    const html = renderToStaticMarkup(<MacIdentityPanel candidateId="candidate-1" candidateName="Alice Martin" candidateEmail="alice@example.test" identity={identity} availableIdentities={availableIdentities} isAdmin />);
    expect(html).toContain("Gérer l’identité MAC");
    expect(html).not.toContain("Identité créée le");
    expect(html).not.toContain("value=\"22222222-2222-4222-8222-222222f86f3e\"");
  });
});
