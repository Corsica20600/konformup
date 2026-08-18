import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { TrainingNeedsFormShell } from "./form-shell";
import type { PublicTrainingNeedsAnalysisView, TrainingNeedsTrainingType } from "@/lib/training-needs/types";

function analysis(trainingType: TrainingNeedsTrainingType, currentStep = 4, isReadOnly = false): PublicTrainingNeedsAnalysisView {
  return { id: "public-id", trainingType, status: "in_progress", questionnaireVersion: "1", quote: { companyName: "Entreprise test", quoteNumber: "DEV-2026-01", title: "Formation test", sessionStartDate: null, sessionEndDate: null, location: null }, progress: { currentStep, progressPercent: 60 }, answers: { respondent: { name: "Ada", firstName: "Lovelace", role: "RH", email: "ada@example.test", phone: "0612345678" } }, tokenExpiresAt: null, isReadOnly };
}

describe("public training-needs form", () => {
  it.each([["sst_initial", "Expérience des premiers secours"], ["mac_sst", "État des certificats"], ["hygiene", "Type d’établissement"]] as const)("renders %s specific questions", (trainingType, label) => {
    const markup = renderToStaticMarkup(<TrainingNeedsFormShell token="not-rendered" analysis={analysis(trainingType)} />);
    expect(markup).toContain(label); expect(markup).not.toContain("companyId"); expect(markup).not.toContain("token_hash");
  });
  it("restores saved answers and displays the review", () => {
    const markup = renderToStaticMarkup(<TrainingNeedsFormShell token="not-rendered" analysis={{ ...analysis("sst_initial", 5), answers: { respondent: { name: "Ada Lovelace", firstName: "Ada", role: "RH", email: "ada@example.test", phone: "0612345678" }, objectives: "Adapter la formation", participantProfiles: ["Atelier"] } }} />);
    expect(markup).toContain("Ada Lovelace"); expect(markup).toContain("Adapter la formation"); expect(markup).toContain("Modifier");
  });
  it("renders confirmation-only readonly state after finalization", () => {
    const markup = renderToStaticMarkup(<TrainingNeedsFormShell token="not-rendered" analysis={analysis("hygiene", 5, true)} />);
    expect(markup).toContain("Analyse transmise"); expect(markup).toContain("a bien été transmise"); expect(markup).not.toContain("Valider définitivement l’analyse"); expect(markup).not.toContain("Modifier");
  });
});
