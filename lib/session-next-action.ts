import { getSessionClosureReadiness } from "@/lib/session-closure";
import type { GeneratedDocumentItem, SessionCandidate, SessionItem } from "@/lib/types";

export type SessionNextAction = {
  label: string;
  description: string;
  href: string;
};

const FINAL_DOCUMENT_STATUSES = new Set(["generated", "sent", "signed", "archived"]);

export function getSessionNextAction({
  session,
  candidates,
  documents,
  globalProgress
}: {
  session: SessionItem;
  candidates: SessionCandidate[];
  documents: GeneratedDocumentItem[];
  globalProgress: number;
}): SessionNextAction {
  if (session.closure_status === "closed" || session.status === "completed") {
    const availableDocuments = documents.filter((document) => FINAL_DOCUMENT_STATUSES.has(document.status));
    const hasBilan = availableDocuments.some((document) => document.document_type === "bilan_session");
    const hasSynthese = availableDocuments.some((document) => document.document_type === "synthese_societe");
    const admittedCandidateIds = candidates
      .filter((candidate) => candidate.evaluations?.some((evaluation) => evaluation.evaluation_type === "globale" && evaluation.result === "admis"))
      .map((candidate) => candidate.candidate.id);
    const attestationCandidateIds = new Set(
      availableDocuments
        .filter((document) => document.document_type === "attestation" && document.candidate_id)
        .map((document) => document.candidate_id)
    );
    const missingAttestationCount = admittedCandidateIds.filter((candidateId) => !attestationCandidateIds.has(candidateId)).length;

    if (hasBilan && hasSynthese && missingAttestationCount === 0) {
      return {
        label: "Consulter les documents finaux",
        description: `Bilan et synthèse générés. Attestations : ${admittedCandidateIds.length}/${admittedCandidateIds.length}.`,
        href: "#cloture-session"
      };
    }

    const missing = [!hasBilan ? "bilan" : null, !hasSynthese ? "synthèse" : null]
      .filter(Boolean)
      .join(", ");
    return {
      label: "Finaliser les documents",
      description: `${missing ? `À générer : ${missing}. ` : ""}Attestations manquantes : ${missingAttestationCount}.`,
      href: "#cloture-session"
    };
  }

  if (candidates.length === 0) {
    return {
      label: "Ajouter les candidats",
      description: "Commence par constituer la liste des participants à cette session.",
      href: "#ajouter-candidat"
    };
  }

  const generatedBeforeTraining = new Set(
    documents
      .filter((document) => document.candidate_id && ["convocation", "welcome_pack"].includes(document.document_type))
      .map((document) => `${document.candidate_id}:${document.document_type}`)
  );
  const missingBeforeTrainingDocument = candidates.some(
    ({ candidate }) =>
      !generatedBeforeTraining.has(`${candidate.id}:convocation`) ||
      !generatedBeforeTraining.has(`${candidate.id}:welcome_pack`)
  );

  if (missingBeforeTrainingDocument) {
    return {
      label: "Préparer les convocations",
      description: "Génère les convocations et livrets avant le démarrage de la formation.",
      href: "#candidats-session"
    };
  }

  if (session.status === "draft" || session.status === "scheduled") {
    return {
      label: "Préparer le déroulé pédagogique",
      description: "Les participants et leurs documents sont prêts pour l'animation.",
      href: "#deroule-pedagogique"
    };
  }

  if (session.status === "in_progress" && globalProgress < 100) {
    return {
      label: "Gérer l'émargement",
      description: "Poursuis le déroulé et vérifie les réponses de présence.",
      href: "#emargement-session"
    };
  }

  const readiness = getSessionClosureReadiness(candidates);
  if (!readiness.canClose) {
    return {
      label: "Saisir les évaluations",
      description: `${readiness.missingGlobalEvaluationCount} résultat(s) global(aux) restent à renseigner.`,
      href: "#candidats-session"
    };
  }

  return {
    label: "Préparer la clôture",
    description: "Les résultats globaux sont complets. Vérifie le bilan avant de clôturer.",
    href: "#cloture-session"
  };
}
