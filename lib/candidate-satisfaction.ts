export const candidateSatisfactionQuestions = [
  { key: "organisation_information", label: "Les informations reçues avant la formation étaient claires" },
  { key: "organisation_accueil", label: "L’accueil et l’organisation étaient satisfaisants" },
  { key: "organisation_locaux", label: "Les locaux et les conditions matérielles étaient adaptés" },
  { key: "contenu_objectifs", label: "Les objectifs et le contenu de la formation étaient clairs" },
  { key: "contenu_pratique", label: "Les exercices et mises en situation étaient utiles" },
  { key: "formateur_maitrise", label: "Le formateur maîtrisait le sujet et ses explications étaient claires" },
  { key: "formateur_ecoute", label: "Le formateur était disponible, à l’écoute et favorisait les échanges" },
  { key: "competences", label: "À l’issue de la formation, vous sentez-vous capable d’appliquer les gestes et compétences SST ?" },
  { key: "satisfaction_globale", label: "Votre niveau global de satisfaction" },
  { key: "attentes", label: "La formation a-t-elle répondu à vos attentes ?" },
  { key: "recommandation", label: "Recommanderiez-vous cette formation à un collègue ? (0 à 10)" },
  { key: "apprecie", label: "Ce que vous avez le plus apprécié" },
  { key: "ameliorations", label: "Ce qui pourrait être amélioré" },
  { key: "remarques", label: "Autres remarques ou suggestions" }
] as const;

export type CandidateSatisfactionAnswerKey = (typeof candidateSatisfactionQuestions)[number]["key"];
