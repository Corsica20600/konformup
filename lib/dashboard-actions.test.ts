import { describe, expect, it } from "vitest";
import { getDashboardActions } from "@/lib/dashboard-actions";
import type { SessionItem } from "@/lib/types";

function session(overrides: Partial<SessionItem>): SessionItem {
  return {
    id: "session-id",
    status: "scheduled",
    closure_status: "open",
    ...overrides
  } as SessionItem;
}

describe("dashboard actions", () => {
  it("keeps only reliable actions that currently need attention", () => {
    const actions = getDashboardActions(
      [session({ status: "scheduled" }), session({ id: "ready", status: "in_progress", closure_status: "ready" })],
      ["draft", "accepted"]
    );

    expect(actions.map((action) => [action.label, action.count])).toEqual([
      ["Devis à traiter", 1],
      ["Sessions à préparer", 1],
      ["Sessions en cours", 1],
      ["Sessions à clôturer", 1]
    ]);
  });

  it("returns no urgent action when everything is complete", () => {
    expect(getDashboardActions([session({ status: "completed", closure_status: "closed" })], ["accepted"])).toEqual([]);
  });
});
