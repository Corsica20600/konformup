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
    const evaluation = getExplicitGlobalEvaluation(candidate);
    return !evaluation || !CLEAR_GLOBAL_RESULTS.has(evaluation.result);
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
  const baseDocuments = ["Attestation interne de fin de formation", "Bilan session"];

  if (!isSstTrainingType(trainingType)) {
    return baseDocuments;
  }

  return [...baseDocuments, "Trace administrative du certificat SST officiel / FORPREV"];
}

export function getSstCertificateNotice(trainingType: TrainingType) {
  if (trainingType === "hygiene") {
    return "Aucune reference de certificat professionnel complementaire n'est requise pour cette formation.";
  }

  if (trainingType === "mac_sst") {
    return "Certificat SST / MAC SST a renseigner dans le registre FORPREV lorsque la validation est acquise.";
  }

  return "Certificat SST a renseigner dans le registre FORPREV lorsque la validation est acquise.";
}
