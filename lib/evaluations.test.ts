import { describe, expect, it } from "vitest";
import {
  deriveCandidateValidationStatus,
  deriveEvaluationStatusFromResult,
  getGlobalEvaluation,
  resolveCandidateWorkflowLabel
} from "@/lib/evaluations";
import type { CandidateEvaluation } from "@/lib/types";

function buildEvaluation(overrides: Partial<CandidateEvaluation>): CandidateEvaluation {
  return {
    id: "evaluation-id",
    session_id: "session-id",
    candidate_id: "candidate-id",
    evaluation_type: "globale",
    status: "non_evalue",
    result: "non_renseigne",
    trainer_notes: null,
    evaluated_at: null,
    evaluated_by: null,
    metadata: {},
    created_at: "2026-04-19T12:00:00.000Z",
    updated_at: "2026-04-19T12:00:00.000Z",
    ...overrides
  };
}

describe("candidate evaluations", () => {
  it("maps admitted and non-admitted results to candidate validation status", () => {
    expect(deriveCandidateValidationStatus("admis")).toBe("validated");
    expect(deriveCandidateValidationStatus("non_admis")).toBe("not_validated");
    expect(deriveCandidateValidationStatus("absent")).toBe("not_validated");
    expect(deriveCandidateValidationStatus("partiel")).toBe("pending");
    expect(deriveCandidateValidationStatus("non_renseigne")).toBe("pending");
  });

  it("derives the evaluation status from decisive results", () => {
    expect(deriveEvaluationStatusFromResult("admis", "en_cours")).toBe("acquis");
    expect(deriveEvaluationStatusFromResult("non_admis", "en_cours")).toBe("non_acquis");
    expect(deriveEvaluationStatusFromResult("absent", "en_cours")).toBe("absent");
    expect(deriveEvaluationStatusFromResult("partiel", "non_evalue")).toBe("en_cours");
    expect(deriveEvaluationStatusFromResult("non_renseigne", "non_evalue")).toBe("non_evalue");
  });

  it("resolves the current workflow label from evaluation data", () => {
    expect(
      resolveCandidateWorkflowLabel({
        validationStatus: "pending",
        evaluationStatus: "absent",
        result: "absent"
      })
    ).toBe("Absent");

    expect(
      resolveCandidateWorkflowLabel({
        validationStatus: "pending",
        evaluationStatus: "en_cours",
        result: "partiel"
      })
    ).toBe("Partiellement present");

    expect(resolveCandidateWorkflowLabel({ validationStatus: "pending" })).toBe("Inscrit");
  });

  it("prefers the latest global evaluation when multiple entries exist", () => {
    const evaluation = getGlobalEvaluation([
      buildEvaluation({
        id: "practice",
        evaluation_type: "pratique",
        evaluated_at: "2026-04-19T12:00:00.000Z"
      }),
      buildEvaluation({
        id: "global",
        evaluation_type: "globale",
        evaluated_at: "2026-04-18T12:00:00.000Z"
      })
    ]);

    expect(evaluation?.id).toBe("global");
  });
});
