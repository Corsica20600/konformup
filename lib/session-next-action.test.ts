import { describe, expect, it } from "vitest";
import { getSessionNextAction } from "@/lib/session-next-action";
import type { GeneratedDocumentItem, SessionCandidate, SessionItem } from "@/lib/types";

const session = {
  id: "session-id",
  status: "scheduled",
  closure_status: "open"
} as SessionItem;

const candidate = {
  candidate: { id: "candidate-id", validation_status: "pending" },
  evaluations: []
} as unknown as SessionCandidate;

function buildDocument(type: string): GeneratedDocumentItem {
  return { candidate_id: "candidate-id", document_type: type, status: "generated" } as GeneratedDocumentItem;
}

describe("session next action", () => {
  it("starts with candidate creation for an empty session", () => {
    expect(getSessionNextAction({ session, candidates: [], documents: [], globalProgress: 0 }).label).toBe(
      "Ajouter les candidats"
    );
  });

  it("distinguishes missing and complete final documents for a closed session", () => {
    expect(
      getSessionNextAction({
        session: { ...session, status: "completed", closure_status: "closed" },
        candidates: [],
        documents: [],
        globalProgress: 100
      }).label
    ).toBe("Finaliser les documents");

    const admittedCandidate = {
      ...candidate,
      candidate: { ...candidate.candidate, validation_status: "validated" },
      evaluations: [{ evaluation_type: "globale", result: "admis" }]
    } as unknown as SessionCandidate;
    expect(
      getSessionNextAction({
        session: { ...session, status: "completed", closure_status: "closed" },
        candidates: [admittedCandidate],
        documents: ["bilan_session", "synthese_societe", "attestation"].map(buildDocument),
        globalProgress: 100
      }).label
    ).toBe("Consulter les documents finaux");
  });

  it("guides a populated session through documents and evaluations", () => {
    expect(getSessionNextAction({ session, candidates: [candidate], documents: [], globalProgress: 0 }).label).toBe(
      "Préparer les convocations"
    );

    expect(
      getSessionNextAction({
        session: { ...session, status: "in_progress" },
        candidates: [candidate],
        documents: [buildDocument("convocation"), buildDocument("welcome_pack")],
        globalProgress: 100
      }).label
    ).toBe("Saisir les évaluations");
  });
});
