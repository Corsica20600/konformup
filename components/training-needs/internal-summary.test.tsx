import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { TrainingNeedsAnswersSummary, TrainingNeedsStatusBadge } from "./internal-summary";

describe("internal training-needs display", () => {
  it.each([["draft", "À envoyer"], ["sent", "Envoyée"], ["in_progress", "En cours"], ["completed", "Validée"], ["cancelled", "Annulée"]] as const)("uses a human label for %s", (status, label) => expect(renderToStaticMarkup(<TrainingNeedsStatusBadge status={status} />)).toContain(label));
  it("renders answers without secrets", () => { const html = renderToStaticMarkup(<TrainingNeedsAnswersSummary answers={{ objectives: "Adapter", respondent: { name: "Ada" } }} />); expect(html).toContain("Adapter"); expect(html).not.toContain("token_hash"); });
});
