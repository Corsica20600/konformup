import type { QuoteStatus } from "@/lib/database.types";
import type { SessionItem } from "@/lib/types";

export type DashboardAction = {
  label: string;
  description: string;
  count: number;
  href: string;
};

export function getDashboardActions(sessions: SessionItem[], quoteStatuses: QuoteStatus[]): DashboardAction[] {
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
      label: "Sessions en cours",
      description: "Formations à animer, pointer ou évaluer aujourd'hui.",
      count: sessions.filter((session) => session.status === "in_progress").length,
      href: "/sessions"
    },
    {
      label: "Sessions à clôturer",
      description: "Dossiers marqués prêts pour la clôture administrative.",
      count: sessions.filter(
        (session) => session.closure_status === "ready" && session.status !== "completed" && session.status !== "cancelled"
      ).length,
      href: "/sessions"
    }
  ].filter((action) => action.count > 0);
}
