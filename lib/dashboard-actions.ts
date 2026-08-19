import type { QuoteStatus } from "@/lib/database.types";
import type { DashboardWorkflowSnapshot, SessionItem } from "@/lib/types";

export type DashboardAction = {
  label: string;
  description: string;
  count: number;
  href: string;
};

const CLEAR_EVALUATION_RESULTS = new Set(["admis", "non_admis", "absent", "partiel"]);

export function getDashboardActions(
  sessions: SessionItem[],
  quoteStatuses: QuoteStatus[],
  workflow?: DashboardWorkflowSnapshot
): DashboardAction[] {
  const activeSessions = sessions.filter(
    (session) => session.status !== "completed" && session.status !== "cancelled"
  );
  const candidateIdsBySession = new Map<string, string[]>();
  for (const candidate of workflow?.candidates ?? []) {
    candidateIdsBySession.set(candidate.session_id, [
      ...(candidateIdsBySession.get(candidate.session_id) ?? []),
      candidate.id
    ]);
  }

  const evaluatedCandidateIds = new Set(
    (workflow?.globalEvaluations ?? [])
      .filter((evaluation) => CLEAR_EVALUATION_RESULTS.has(evaluation.result))
      .map((evaluation) => evaluation.candidate_id)
  );
  const attendanceSessionIds = new Set((workflow?.attendanceSlots ?? []).map((slot) => slot.session_id));
  const finalDocumentTypesBySession = new Map<string, Set<string>>();
  for (const document of workflow?.finalDocuments ?? []) {
    const types = finalDocumentTypesBySession.get(document.session_id) ?? new Set<string>();
    types.add(document.document_type);
    finalDocumentTypesBySession.set(document.session_id, types);
  }

  return [
    {
      label: "Devis à traiter",
      description: "Brouillons à finaliser ou devis envoyés en attente de décision.",
      count: quoteStatuses.filter((status) => status === "draft" || status === "sent").length,
      href: "/companies"
    },
    {
      label: "Sessions à préparer",
      description: "Sessions en brouillon ou planifiées avant leur démarrage.",
      count: sessions.filter((session) => session.status === "draft" || session.status === "scheduled").length,
      href: "/sessions"
    },
    {
      label: "Candidats à ajouter",
      description: "Sessions actives dont la liste des participants est encore vide.",
      count: workflow
        ? activeSessions.filter((session) => !candidateIdsBySession.has(session.id)).length
        : 0,
      href: "/sessions"
    },
    {
      label: "Émargements en attente",
      description: "Sessions avec au moins un créneau d'émargement encore ouvert.",
      count: activeSessions.filter((session) => attendanceSessionIds.has(session.id)).length,
      href: "/sessions"
    },
    {
      label: "Évaluations à compléter",
      description: "Sessions en cours avec des résultats globaux encore manquants.",
      count: activeSessions.filter((session) => {
        if (session.status !== "in_progress") return false;
        const candidateIds = candidateIdsBySession.get(session.id) ?? [];
        return candidateIds.length > 0 && candidateIds.some((candidateId) => !evaluatedCandidateIds.has(candidateId));
      }).length,
      href: "/sessions"
    },
    {
      label: "Sessions à clôturer",
      description: "Dossiers marqués prêts pour la clôture administrative.",
      count: sessions.filter(
        (session) => session.closure_status === "ready" && session.status !== "completed" && session.status !== "cancelled"
      ).length,
      href: "/sessions"
    },
    {
      label: "Bilans de session à générer",
      description: "Sessions clôturées sans bilan de session finalisé.",
      count: workflow
        ? sessions.filter((session) => {
            if (session.status !== "completed" && session.closure_status !== "closed") return false;
            const types = finalDocumentTypesBySession.get(session.id);
            return !types?.has("bilan_session");
          }).length
        : 0,
      href: "/sessions"
    }
  ];
}
