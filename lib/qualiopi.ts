import type { OrganizationSettings, SessionItem } from "@/lib/types";

export type QualiopiReadinessItem = {
  label: string;
  detail: string;
};

export type QualiopiReadinessSnapshot = {
  completionRate: number;
  blockingItems: QualiopiReadinessItem[];
  warningItems: QualiopiReadinessItem[];
};

function hasValue(value: string | number | null | undefined) {
  if (typeof value === "number") {
    return Number.isFinite(value);
  }

  return Boolean(value?.toString().trim());
}

export function getQualiopiReadinessSnapshot({
  organization,
  sessions
}: {
  organization: OrganizationSettings;
  sessions: SessionItem[];
}): QualiopiReadinessSnapshot {
  const blockingItems: QualiopiReadinessItem[] = [];
  const warningItems: QualiopiReadinessItem[] = [];

  if (!hasValue(organization.organization_name)) {
    blockingItems.push({
      label: "Organisme",
      detail: "Le nom de l'organisme de formation n'est pas renseigné."
    });
  }

  if (!hasValue(organization.address)) {
    blockingItems.push({
      label: "Adresse",
      detail: "L'adresse de l'organisme n'est pas renseignée."
    });
  }

  if (!hasValue(organization.siret)) {
    blockingItems.push({
      label: "SIRET",
      detail: "Le SIRET est nécessaire pour fiabiliser les documents administratifs."
    });
  }

  if (!hasValue(organization.training_declaration_number)) {
    blockingItems.push({
      label: "NDA",
      detail: "Le numéro de déclaration d'activité n'est pas encore renseigné."
    });
  }

  if (!hasValue(organization.qualiopi_mention)) {
    warningItems.push({
      label: "Mention Qualiopi",
      detail: "La mention de certification n'apparaîtra pas sur les attestations."
    });
  }

  if (!hasValue(organization.certificate_signatory_name)) {
    warningItems.push({
      label: "Signataire",
      detail: "Le nom du signataire des attestations manque dans les paramètres."
    });
  }

  const sessionsWithoutTrainer = sessions.filter((session) => !hasValue(session.trainer_name));
  if (sessionsWithoutTrainer.length > 0) {
    warningItems.push({
      label: "Formateur",
      detail: `${sessionsWithoutTrainer.length} session(s) n'ont pas de formateur renseigné.`
    });
  }

  const sessionsWithoutDuration = sessions.filter((session) => !hasValue(session.duration_hours));
  if (sessionsWithoutDuration.length > 0) {
    warningItems.push({
      label: "Durée",
      detail: `${sessionsWithoutDuration.length} session(s) n'ont pas de durée renseignée.`
    });
  }

  if (sessions.length === 0) {
    warningItems.push({
      label: "Sessions",
      detail: "Aucune session n'est encore créée pour constituer des preuves de réalisation."
    });
  }

  const completedChecks = 6 - blockingItems.length - Math.min(warningItems.length, 2);
  const completionRate = Math.max(0, Math.round((completedChecks / 6) * 100));

  return {
    completionRate,
    blockingItems,
    warningItems
  };
}
