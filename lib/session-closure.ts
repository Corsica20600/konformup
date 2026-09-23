import type { ForprevRegistrationStatus, TrainingType } from "@/lib/database.types";
import type { SessionCandidate } from "@/lib/types";

export type SessionClosureSummary = {
  registeredCount: number;
  presentCount: number;
  admittedCount: number;
  notAdmittedCount: number;
  absentCount: number;
};

export type SessionClosureReadiness = {
  canClose: boolean;
  missingGlobalEvaluationCount: number;
};

const CLEAR_GLOBAL_RESULTS = new Set(["admis", "non_admis", "absent", "partiel"]);

export function hasClearGlobalEvaluation(
  evaluations: Array<{ evaluation_type: string; result: string; evaluated_at: string | null }> = []
) {
  const evaluation = [...evaluations]
    .filter((evaluation) => evaluation.evaluation_type === "globale")
    .sort((left, right) => {
      const leftDate = left.evaluated_at ? new Date(left.evaluated_at).getTime() : 0;
      const rightDate = right.evaluated_at ? new Date(right.evaluated_at).getTime() : 0;
      return rightDate - leftDate;
    })[0] ?? null;

  return Boolean(evaluation && CLEAR_GLOBAL_RESULTS.has(evaluation.result));
}

export function hasCompleteSessionEvaluation(
  trainingType: TrainingType,
  evaluations: Array<{ evaluation_type: string; result: string; status: string; evaluated_at: string | null }> = []
) {
  if (!hasClearGlobalEvaluation(evaluations)) return false;
  if (trainingType === "ai") return true;

  const latest = (type: string) => [...evaluations]
    .filter((evaluation) => evaluation.evaluation_type === type)
    .sort((left, right) => (right.evaluated_at ?? "").localeCompare(left.evaluated_at ?? ""))[0];
  const global = latest("globale");
  if (global?.result === "absent") return true;
  return !["theorique", "pratique"].some((type) => !latest(type) || latest(type)?.status === "non_evalue");
}

function getExplicitGlobalEvaluation(candidate: SessionCandidate) {
  return [...(candidate.evaluations ?? [])]
    .filter((evaluation) => evaluation.evaluation_type === "globale")
    .sort((left, right) => {
      const leftDate = left.evaluated_at ? new Date(left.evaluated_at).getTime() : 0;
      const rightDate = right.evaluated_at ? new Date(right.evaluated_at).getTime() : 0;
      return rightDate - leftDate;
    })[0] ?? null;
}

export function getSessionClosureReadiness(candidates: SessionCandidate[]): SessionClosureReadiness {
  const missingGlobalEvaluationCount = candidates.filter((candidate) => {
    return !hasClearGlobalEvaluation(candidate.evaluations);
  }).length;

  return {
    canClose: missingGlobalEvaluationCount === 0,
    missingGlobalEvaluationCount
  };
}

export function isSstTrainingType(trainingType: TrainingType) {
  return trainingType === "sst_initial" || trainingType === "mac_sst";
}

export function getForprevStatusForCandidate(trainingType: TrainingType, candidate: SessionCandidate): ForprevRegistrationStatus {
  if (!isSstTrainingType(trainingType)) {
    return "non_applicable";
  }

  if (candidate.candidate.sst_certificate_ref?.trim()) {
    return "saisi";
  }

  return candidate.candidate.validation_status === "validated" ? "a_saisir" : "non_applicable";
}

export function calculateSessionClosureSummary(candidates: SessionCandidate[]): SessionClosureSummary {
  return candidates.reduce<SessionClosureSummary>(
    (summary, candidateSession) => {
      const evaluation = getExplicitGlobalEvaluation(candidateSession);
      const result = evaluation?.result ?? "non_renseigne";
      const isAbsent = result === "absent";
      const isAdmitted = result === "admis" || candidateSession.candidate.validation_status === "validated";
      const isNotAdmitted =
        result === "non_admis" ||
        (!isAbsent && candidateSession.candidate.validation_status === "not_validated");

      summary.registeredCount += 1;
      summary.absentCount += isAbsent ? 1 : 0;
      summary.presentCount += isAbsent ? 0 : 1;
      summary.admittedCount += isAdmitted ? 1 : 0;
      summary.notAdmittedCount += isNotAdmitted ? 1 : 0;

      return summary;
    },
    {
      registeredCount: 0,
      presentCount: 0,
      admittedCount: 0,
      notAdmittedCount: 0,
      absentCount: 0
    }
  );
}

export function getFinalDocumentSet(trainingType: TrainingType) {
  // The internal attestation is issued only to admitted candidates; the session report is mandatory.
  // FORPREV remains an external register and is never a generated or required Konform'up document.
  void trainingType;
  return ["Attestation interne de fin de formation (candidats admis)", "Bilan session"];
}

export function getRequiredFinalDocumentTypes(trainingType: TrainingType) {
  void trainingType;
  return ["bilan_session", "attestation"] as const;
}

export function getSstCertificateNotice(trainingType: TrainingType) {
  if (trainingType === "hygiene") {
    return "Aucun certificat professionnel complémentaire n’est requis pour cette formation.";
  }

  if (trainingType === "mac_sst") {
    return "Certificat SST / MAC SST a renseigner dans le registre FORPREV lorsque la validation est acquise.";
  }

  if (trainingType === "sst_initial") {
    return "Certificat SST à renseigner dans le registre FORPREV lorsque la validation est acquise.";
  }

  return "Aucun certificat complémentaire n’est à renseigner pour cette formation.";
}
