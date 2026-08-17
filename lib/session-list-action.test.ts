import { describe, expect, it } from "vitest";
import { getSessionListAction } from "@/lib/session-list-action";
import type { SessionItem } from "@/lib/types";

function session(status: SessionItem["status"], closureStatus: SessionItem["closure_status"] = "open") {
  return { status, closure_status: closureStatus } as SessionItem;
}

describe("session list next action", () => {
  it("maps the main session states to a useful action", () => {
    expect(getSessionListAction(session("scheduled"))).toBe("Préparer candidats et convocations");
    expect(getSessionListAction(session("in_progress"))).toBe("Gérer émargement et évaluations");
    expect(getSessionListAction(session("in_progress", "ready"))).toBe("Clôturer la session");
    expect(getSessionListAction(session("completed", "closed"))).toBe("Générer les documents finaux");
  });
});
