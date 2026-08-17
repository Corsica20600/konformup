import type { TrainingType } from "@/lib/database.types";

export const TRAINING_TYPE_OPTIONS = ["sst_initial", "mac_sst", "hygiene"] as const;

export const TRAINING_TYPE_LABELS: Record<TrainingType, string> = {
  sst_initial: "SST initiale",
  mac_sst: "MAC SST",
  hygiene: "Hygiène"
};

export const DEFAULT_TRAINING_TITLES: Record<TrainingType, string> = {
  sst_initial: "Formation SST initiale",
  mac_sst: "MAC SST",
  hygiene: "Formation Hygiène"
};

export const TRAINING_FAMILY_LABELS: Record<string, string> = {
  sst: "Sauveteur Secouriste du Travail",
  hygiene: "Hygiène"
};

type TrainingProgramDefaults = {
  family: string;
  durationHours: number;
  prerequisites: string;
  objectives: string[];
  programmeLines: string[];
  accessibility: string;
  certificateNote: string;
};

const DEFAULT_PROGRAMS: Record<TrainingType, TrainingProgramDefaults> = {
  sst_initial: {
    family: "sst",
    durationHours: 14,
    prerequisites: "Aucun prérequis particulier.",
    objectives: [
      "Intervenir efficacement face à une situation d'accident du travail.",
      "Contribuer à la prévention des risques professionnels dans l'entreprise.",
      "Situer son rôle de SST dans l'organisation des secours et de la prévention."
    ],
    programmeLines: [
      "Situer le sauveteur secouriste du travail dans la santé et sécurité au travail.",
      "Protéger, examiner, faire alerter ou alerter.",
      "Secourir une victime selon les situations d'urgence rencontrées.",
      "Contribuer à la prévention des risques professionnels.",
      "Participer aux mises en situation et évaluations certificatives SST."
    ],
    accessibility:
      "Formation accessible sous réserve d'une analyse préalable des besoins d'adaptation du participant.",
    certificateNote: "Certificat SST valable 24 mois, sous réserve de validation selon le dispositif applicable."
  },
  mac_sst: {
    family: "sst",
    durationHours: 7,
    prerequisites: "Être titulaire d'un certificat SST ou d'une attestation SST antérieure.",
    objectives: [
      "Maintenir et actualiser les compétences de sauveteur secouriste du travail.",
      "Actualiser les conduites à tenir face aux situations d'urgence.",
      "Renforcer la contribution du SST à la prévention des risques professionnels."
    ],
    programmeLines: [
      "Retour d'expérience sur les actions menées en tant que SST.",
      "Actualisation des compétences de prévention.",
      "Révision et mise en pratique des gestes de secours.",
      "Mises en situation contextualisées.",
      "Évaluations certificatives de maintien et actualisation des compétences."
    ],
    accessibility:
      "Formation accessible sous réserve d'une analyse préalable des besoins d'adaptation du participant.",
    certificateNote: "MAC SST à renouveler tous les 24 mois selon le dispositif applicable."
  },
  hygiene: {
    family: "hygiene",
    durationHours: 7,
    prerequisites: "Aucun prérequis particulier, sauf mention spécifique au devis.",
    objectives: [
      "Comprendre les principes essentiels d'hygiène applicables au contexte professionnel.",
      "Identifier les situations à risque et appliquer les bonnes pratiques.",
      "Sécuriser les gestes professionnels et la traçabilité associée."
    ],
    programmeLines: [
      "Cadre général de l'hygiène en milieu professionnel.",
      "Risques, contaminations et mesures de prévention.",
      "Bonnes pratiques opérationnelles et organisation du poste de travail.",
      "Traçabilité, contrôles et conduite à tenir en cas d'écart.",
      "Synthèse et vérification des acquis."
    ],
    accessibility:
      "Formation accessible sous réserve d'une analyse préalable des besoins d'adaptation du participant.",
    certificateNote: "Attestation de fin de formation délivrée selon les modalités prévues au devis."
  }
};

export function isTrainingType(value: unknown): value is TrainingType {
  return typeof value === "string" && TRAINING_TYPE_OPTIONS.includes(value as TrainingType);
}

export function normalizeTrainingType(value: unknown): TrainingType {
  return isTrainingType(value) ? value : "sst_initial";
}

export function getTrainingProgramDefaults(value: unknown) {
  return DEFAULT_PROGRAMS[normalizeTrainingType(value)];
}

export function getTrainingTypeLabel(value: unknown) {
  return TRAINING_TYPE_LABELS[normalizeTrainingType(value)];
}

export function getTrainingDocumentTitle(value: unknown, title: string | null | undefined) {
  const trainingType = normalizeTrainingType(value);
  const fallback = DEFAULT_TRAINING_TITLES[trainingType];
  const trimmedTitle = title?.trim();

  if (!trimmedTitle || /^(nouvelle prestation|prestation de formation)$/i.test(trimmedTitle)) {
    return fallback;
  }

  if (Object.values(DEFAULT_TRAINING_TITLES).some((defaultTitle) => defaultTitle === trimmedTitle)) {
    return fallback;
  }

  const legacySstTitle = trimmedTitle.match(/^formation\s+sst(?:\s+initiale)?(?:\s*-\s*(.+))?$/i);
  if (legacySstTitle) {
    const suffix = legacySstTitle[1]?.trim();
    return suffix && !/^(nouvelle prestation|prestation de formation)$/i.test(suffix)
      ? `${fallback} - ${suffix}`
      : fallback;
  }

  if (trainingType === "hygiene" && /\b(?:sst|forprev)\b/i.test(trimmedTitle)) {
    return fallback;
  }

  return trimmedTitle;
}

export function getTrainingFamilyLabel(value: string | null | undefined, trainingType: unknown) {
  const family = value?.trim() || getTrainingProgramDefaults(trainingType).family;
  return TRAINING_FAMILY_LABELS[family] ?? family;
}

export function splitProgrammeText(value: string | null | undefined, fallback: string[]) {
  const lines = (value ?? "")
    .split(/\r?\n|•/)
    .map((line) => line.trim())
    .filter(Boolean);

  return lines.length ? lines : fallback;
}

export function splitObjectivesText(value: string | null | undefined, fallback: string[]) {
  const lines = (value ?? "")
    .split(/\r?\n|•/)
    .map((line) => line.trim())
    .filter(Boolean);

  return lines.length ? lines : fallback;
}
