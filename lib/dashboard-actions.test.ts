import { describe, expect, it } from "vitest";
import { getDashboardActions } from "@/lib/dashboard-actions";
import type { DashboardWorkflowSnapshot, SessionItem } from "@/lib/types";

function session(overrides: Partial<SessionItem>): SessionItem {
  return {
    id: "session-id",
    status: "scheduled",
    closure_status: "open",
    ...overrides
  } as SessionItem;
}

describe("dashboard actions", () => {
  it("shows the seven daily workflow actions with reliable counts", () => {
    const workflow: DashboardWorkflowSnapshot = {
      candidates: [{ id: "candidate-1", session_id: "active" }],
      globalEvaluations: [],
      attendanceSlots: [{ session_id: "active", status: "open" }],
      finalDocuments: []
    };
    const actions = getDashboardActions(
      [
        session({ id: "prepare", status: "scheduled" }),
        session({ id: "active", status: "in_progress" }),
        session({ id: "ready", status: "in_progress", closure_status: "ready" }),
        session({ id: "closed", status: "completed", closure_status: "closed" })
      ],
      ["draft", "accepted"],
      workflow
    );

    expect(actions.map((action) => [action.label, action.count])).toEqual([
      ["Devis à traiter", 1],
      ["Sessions à préparer", 1],
      ["Candidats à ajouter", 2],
      ["Émargements en attente", 1],
      ["Évaluations à compléter", 1],
      ["Sessions à clôturer", 1],
      ["Documents finaux à générer", 1]
    ]);
  });

  it("keeps zero-count actions visible as an at-a-glance checklist", () => {
    const actions = getDashboardActions([], ["accepted"], {
      candidates: [],
      globalEvaluations: [],
      attendanceSlots: [],
      finalDocuments: []
    });

    expect(actions).toHaveLength(7);
    expect(actions.every((action) => action.count === 0)).toBe(true);
  });

  it("does not report false workflow alerts when detailed data is unavailable", () => {
    const actions = getDashboardActions(
      [session({ status: "scheduled" }), session({ status: "completed", closure_status: "closed" })],
      []
    );

    expect(actions.find((action) => action.label === "Candidats à ajouter")?.count).toBe(0);
    expect(actions.find((action) => action.label === "Documents finaux à générer")?.count).toBe(0);
  });
});
