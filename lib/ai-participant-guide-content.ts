import type { SessionItem } from "@/lib/types";

export type GuideSection = { title: string; paragraphs?: string[]; bullets?: string[] };
export type GuidePrompt = { title: string; prompt: string };
export type GuideAttendance = "present" | "absent" | "partial" | "issue" | "pending" | "unknown";

export function isAIGuideRecipientEligible(params: { email: string | null | undefined; attendance: GuideAttendance; hasDocument: boolean }) {
  return Boolean(params.email?.trim()) && params.attendance === "present" && params.hasDocument;
}

export const AI_GUIDE_COMMON_SECTIONS: GuideSection[] = [
  {
    title: "Comprendre l’intelligence artificielle",
    paragraphs: [
      "L’intelligence artificielle regroupe des techniques qui permettent à un système informatique d’accomplir certaines tâches : reconnaître des formes, classer des informations, faire des prévisions ou proposer du contenu.",
      "L’IA générative produit du texte, des images, du son ou du code à partir d’une consigne et du contexte disponible. ChatGPT est un assistant conversationnel de ce type : il peut aider à rédiger, résumer, organiser des idées, expliquer un sujet ou préparer un premier livrable.",
      "Une réponse fluide n’est pas une garantie de vérité. L’outil ne connaît pas forcément les informations récentes, peut mal comprendre une demande ou inventer un fait. Vous restez responsable de la vérification, de la décision et de tout envoi ou publication."
    ]
  },
  {
    title: "Construire une demande utile",
    bullets: [
      "Contexte : quelle situation, source ou tâche ?",
      "Rôle : quel angle ou niveau d’expertise souhaitez-vous ?",
      "Tâche : que doit faire précisément l’assistant ?",
      "Contraintes : longueur, éléments à conserver, limites ou points à vérifier ?",
      "Format attendu : tableau, étapes, e-mail, liste ou autre livrable ?"
    ],
    paragraphs: [
      "Exemple : « Contexte : je prépare une réunion d’équipe à partir des notes fictives ci-dessous. Rôle : aide-moi à structurer un compte rendu clair. Tâche : sépare décisions, actions et questions ouvertes. Contraintes : n’ajoute aucun fait et signale les informations manquantes. Format : tableau avec action, responsable et échéance. »"
    ]
  },
  {
    title: "Améliorer par itérations",
    bullets: [
      "Faites une première demande avec le contexte et le résultat souhaité.",
      "Relisez : qu’est-ce qui est utile, imprécis, trop long ou manquant ?",
      "Demandez une correction ciblée et ajoutez les contraintes oubliées.",
      "Vérifiez les faits et validez vous-même le résultat final."
    ],
    paragraphs: [
      "Relance possible : « Garde les trois idées principales, réduis le texte à 120 mots, adopte un ton plus direct et indique séparément tout point que tu ne peux pas vérifier. »"
    ]
  },
  {
    title: "Des usages professionnels à adapter",
    bullets: [
      "Rédiger ou améliorer un e-mail et adapter son ton au destinataire.",
      "Résumer un document autorisé et faire ressortir les actions ou questions.",
      "Organiser des informations, préparer une réunion ou transformer des notes en compte rendu.",
      "Créer une première trame de procédure, de contenu ou de communication.",
      "Préparer une approche commerciale, un rendez-vous ou une relance à relire.",
      "Explorer plusieurs idées ou reformuler un message plus clairement."
    ],
    paragraphs: [
      "Commencez par une tâche limitée et peu risquée. Remplacez les données réelles par des exemples fictifs tant que l’outil et le cadre de votre entreprise ne sont pas autorisés."
    ]
  },
  {
    title: "Vérifier avant d’utiliser",
    bullets: [
      "Hallucinations : un détail, une date, une source ou un chiffre peut être inventé.",
      "Actualité : une réponse peut être dépassée ; contrôlez les informations susceptibles d’avoir changé.",
      "Sources : ouvrez les liens et vérifiez qu’ils soutiennent réellement l’affirmation.",
      "Biais : les exemples et recommandations peuvent refléter des biais ou oublier un point de vue.",
      "Jugement humain : gardez la décision, la validation métier et la responsabilité de l’action."
    ]
  },
  {
    title: "Protéger les informations",
    paragraphs: [
      "N’envoyez pas dans un outil d’IA sans autorisation les mots de passe, données personnelles sensibles, dossiers nominatifs, informations confidentielles de l’entreprise, données clients non nécessaires, documents protégés ou secrets commerciaux.",
      "Utilisez un outil validé par votre organisation, minimisez les données, anonymisez les exemples et respectez les règles internes ainsi que les obligations applicables. En cas de doute, demandez conseil avant de transmettre le contenu."
    ]
  },
  {
    title: "Continuer à pratiquer",
    bullets: [
      "Choisissez une tâche récurrente, simple et sans donnée sensible.",
      "Comparez le temps et la qualité avec votre méthode habituelle.",
      "Vérifiez les faits et demandez une amélioration plutôt que d’accepter la première réponse.",
      "Consultez les règles de votre organisation et la documentation à jour des outils utilisés."
    ],
    paragraphs: [
      "L’IA est une aide à tester et à contrôler, pas une source fiable par défaut ni un substitut à votre expertise."
    ]
  }
];

const variables = "[CONTEXTE], [OBJECTIF], [PUBLIC], [TON], [CONTRAINTES]";

export const AI_GUIDE_PROMPTS: GuidePrompt[] = [
  { title: "Rédiger ou améliorer un e-mail", prompt: `Contexte : [CONTEXTE]. Objectif : [OBJECTIF]. Public : [PUBLIC]. Ton : [TON]. Contraintes : [CONTRAINTES]. Propose un e-mail clair avec un objet. N’invente aucune information et signale les éléments à compléter.` },
  { title: "Résumer un document", prompt: `À partir du texte autorisé ci-dessous, prépare un résumé pour [PUBLIC]. Contexte : [CONTEXTE]. Objectif : [OBJECTIF]. Format : 5 idées clés puis actions. Contraintes : [CONTRAINTES]. Distingue les faits du texte des déductions et indique les informations absentes.` },
  { title: "Préparer une réunion", prompt: `Contexte : [CONTEXTE]. Objectif de la réunion : [OBJECTIF]. Participants : [PUBLIC]. Prépare un ordre du jour de [DURÉE] avec les décisions attendues. Ton : [TON]. Contraintes : [CONTRAINTES].` },
  { title: "Transformer des notes en compte rendu", prompt: `Transforme ces notes autorisées en compte rendu. Contexte : [CONTEXTE]. Public : [PUBLIC]. Format : décisions, actions, responsables, échéances et questions ouvertes. Contraintes : [CONTRAINTES]. N’ajoute aucun fait ; marque « à confirmer » quand une information manque.` },
  { title: "Expliquer un sujet", prompt: `Explique [SUJET] à [PUBLIC]. Contexte : [CONTEXTE]. Objectif : [OBJECTIF]. Ton : [TON]. Utilise un exemple simple, définis les termes techniques et distingue ce qui est certain de ce qui doit être vérifié. Contraintes : [CONTRAINTES].` },
  { title: "Créer une procédure", prompt: `Contexte de travail : [CONTEXTE]. Objectif de la procédure : [OBJECTIF]. Public : [PUBLIC]. Propose des étapes numérotées, les points de contrôle et les cas à escalader. Contraintes : [CONTRAINTES]. N’invente pas d’obligation réglementaire : signale ce qui exige une validation interne.` },
  { title: "Préparer une communication", prompt: `Prépare une première communication sur [SUJET] pour [PUBLIC]. Objectif : [OBJECTIF]. Canal : [CANAL]. Ton : [TON]. Contraintes : [CONTRAINTES]. Donne deux variantes et liste les affirmations à valider avant publication.` },
  { title: "Analyser une idée", prompt: `Contexte : [CONTEXTE]. Idée à examiner : [OBJECTIF]. Public concerné : [PUBLIC]. Présente bénéfices, limites, risques, questions à clarifier et un petit test à réaliser. Contraintes : [CONTRAINTES]. Évite de présenter une hypothèse comme un fait.` },
  { title: "Trouver des solutions", prompt: `Problème : [OBJECTIF]. Contexte : [CONTEXTE]. Public concerné : [PUBLIC]. Génère cinq pistes différentes, compare leur effort et leurs risques, puis propose un test réversible. Ton : [TON]. Contraintes : [CONTRAINTES].` }
];

export function splitGuideLines(value: string | null | undefined) {
  return (value ?? "")
    .split(/\r?\n|\u2022|;/)
    .map((line) => line.replace(/^\s*[-*•\d.)]+\s*/, "").trim())
    .filter(Boolean);
}

export function getAiGuideSessionFocus(session: Pick<SessionItem, "title" | "objectives" | "programme_outline">) {
  return {
    title: session.title.trim() || "Formation IA",
    objectives: splitGuideLines(session.objectives),
    practiceThemes: splitGuideLines(session.programme_outline).slice(0, 4),
    promptVariables: variables
  };
}
