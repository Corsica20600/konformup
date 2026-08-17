import type {
  CandidateEvaluationResult,
  CandidateEvaluationStatus,
  CandidateEvaluationType,
  CandidateValidationStatus
} from "@/lib/database.types";

export const EVALUATION_TYPE_LABELS: Record<CandidateEvaluationType, string> = {
  theorique: "Theorique",
  pratique: "Pratique",
  globale: "Globale"
};

export const EVALUATION_STATUS_LABELS: Record<CandidateEvaluationStatus, string> = {
  non_evalue: "Non evalue",
  en_cours: "En cours",
  acquis: "Acquis",
  non_acquis: "Non acquis",
  absent: "Absent"
};

export const EVALUATION_RESULT_LABELS: Record<CandidateEvaluationResult, string> = {
  admis: "Admis",
  non_admis: "Non admis",
  absent: "Absent",
  partiel: "Partiel",
  non_renseigne: "Non renseigne"
};

export function shouldSyncCandidateStatus(evaluationType: CandidateEvaluationType) {
  return evaluationType === "globale";
}

export function deriveCandidateValidationStatus(result: CandidateEvaluationResult): CandidateValidationStatus {
  if (result === "admis") {
    return "validated";
  }

  if (result === "non_admis" || result === "absent") {
    return "not_validated";
  }

  return "pending";
}

export function deriveEvaluationStatusFromResult(
  result: CandidateEvaluationResult,
  fallbackStatus: CandidateEvaluationStatus
): CandidateEvaluationStatus {
  if (result === "admis") {
    return "acquis";
  }

  if (result === "non_admis") {
    return "non_acquis";
  }

  if (result === "absent") {
    return "absent";
  }

  if (result === "partiel") {
    return "en_cours";
  }

  return fallbackStatus;
}

export function resolveCandidateWorkflowLabel({
  validationStatus,
  evaluationStatus,
  result
}: {
  validationStatus: CandidateValidationStatus;
  evaluationStatus?: CandidateEvaluationStatus | null;
  result?: CandidateEvaluationResult | null;
}) {
  if (result === "admis") {
    return "Admis";
  }

  if (result === "non_admis") {
    return "Non admis";
  }

  if (result === "absent" || evaluationStatus === "absent") {
    return "Absent";
  }

  if (result === "partiel") {
    return "Partiellement present";
  }

  if (evaluationStatus && evaluationStatus !== "non_evalue") {
    return "Evalue";
  }

  if (validationStatus === "validated") {
    return "Admis";
  }

  if (validationStatus === "not_validated") {
    return "Non admis";
  }

  return "Inscrit";
}

export function getGlobalEvaluation<T extends { evaluation_type: CandidateEvaluationType; evaluated_at: string | null }>(
  evaluations: T[] | null | undefined
) {
  return getEvaluationByType(evaluations, "globale") ?? getLatestEvaluation(evaluations);
}

function getLatestEvaluation<T extends { evaluated_at: string | null }>(evaluations: T[] | null | undefined) {
  const sorted = [...(evaluations ?? [])].sort((a, b) => {
    const left = a.evaluated_at ? new Date(a.evaluated_at).getTime() : 0;
    const right = b.evaluated_at ? new Date(b.evaluated_at).getTime() : 0;
    return right - left;
  });

  return sorted[0] ?? null;
}

export function getEvaluationByType<
  T extends { evaluation_type: CandidateEvaluationType; evaluated_at: string | null }
>(evaluations: T[] | null | undefined, evaluationType: CandidateEvaluationType) {
  return getLatestEvaluation(
    (evaluations ?? []).filter((evaluation) => evaluation.evaluation_type === evaluationType)
  );
}
