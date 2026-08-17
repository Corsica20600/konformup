import type { SessionItem } from "@/lib/types";

export function getSessionListAction(session: SessionItem) {
  if (session.closure_status === "closed" || session.status === "completed") {
    return "Générer les documents finaux";
  }

  if (session.closure_status === "ready") {
    return "Clôturer la session";
  }

  if (session.status === "in_progress") {
    return "Gérer émargement et évaluations";
  }

  if (session.status === "draft" || session.status === "scheduled") {
    return "Préparer candidats et convocations";
  }

  return "Consulter la session";
}
