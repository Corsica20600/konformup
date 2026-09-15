export type TrainingModuleTemplate = {
  key: string;
  order: number;
  title: string;
  description: string;
  estimatedMinutes: number | null;
  textContent: string;
  trainerGuidance: string;
  videoUrl: string | null;
  pdfUrl: string | null;
  media?: { expectedFileName: string; title: string; durationSeconds: number; transcript: string; videoPath?: string };
};

export type TrainingQuizTemplate = {
  moduleKey: string;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: "A" | "B" | "C" | "D";
  explanation: string;
};

export const AI_MODULES: TrainingModuleTemplate[] = [
  {
    key: "ai-01-welcome",
    order: 1,
    title: "Accueil et objectifs",
    description: "Poser le cadre, les objectifs et le déroulé des deux heures.",
    estimatedMinutes: 5,
    textContent: "Bienvenue dans l’initiation à l’intelligence artificielle.\n\nUne IA désigne un ensemble de techniques qui permettent à une machine de reconnaître, classer, prévoir ou proposer un contenu. Nous en utilisons déjà au quotidien : GPS, filtre anti-spam, recommandations de films ou de musique, reconnaissance faciale, traduction automatique.\n\nL’IA classique analyse surtout des données ; l’IA générative peut aussi produire du texte, une image, un son, une vidéo ou du code à partir d’une demande. Une réponse bien rédigée peut toutefois être fausse : pendant cette séance, nous allons profiter de sa vitesse sans lui abandonner notre jugement.\n\nObjectifs : comprendre ce qu’est une IA générative, repérer des usages professionnels utiles, structurer une demande avec O-C-R-L, vérifier un résultat et protéger les informations de l’entreprise. Les exemples et exercices utilisent uniquement des données fictives.",
    trainerGuidance: "Objectif : donner une définition simple de l’IA et poser le cadre de la séance.\n\nTexte à dire : l’IA n’est ni un robot qui sait tout, ni une intelligence humaine enfermée dans un ordinateur. Elle réalise des tâches pour lesquelles nous mobilisons habituellement certaines capacités humaines.\n\nQuestion au groupe : « Pouvez-vous citer une IA que vous utilisez déjà dans votre quotidien ? »\n\nRéponses possibles : GPS, recommandations, filtre anti-spam, reconnaissance faciale, traduction automatique, assistant vocal.\n\nMessage clé : l’IA générative ajoute la capacité de produire, mais elle ne garantit ni vérité ni jugement.\n\nTransition : « Voyons maintenant ce que vous en pensez déjà et ce qu’elle peut réellement faire. »",
    videoUrl: null,
    pdfUrl: null
  },
  {
    key: "ai-02-diagnostic",
    order: 2,
    title: "Diagnostic initial",
    description: "Faire émerger les représentations et les bons réflexes avant l’apport.",
    estimatedMinutes: 7,
    textContent: "Quiz diagnostic non noté : répondre collectivement puis commenter les réponses.\n\nÀ retenir : une IA générative ne cherche pas automatiquement sur Internet ; une réponse bien écrite n’est pas forcément exacte ; on peut toujours demander une correction ; les données client ne vont pas dans un outil non autorisé ; Codex sert à travailler dans un projet de code ; le contexte, la vérification et le dialogue sont plus utiles qu’un « prompt magique ».",
    trainerGuidance: "Ne pas noter ce quiz. Faire verbaliser les intuitions, puis annoncer que les réponses seront reprises au fil de la séance.",
    videoUrl: null,
    pdfUrl: null
  },
  {
    key: "ai-03-generative-ai",
    order: 3,
    title: "Comprendre l’IA générative",
    description: "Définir l’IA générative et distinguer ses usages de la recherche et de l’expertise humaine.",
    estimatedMinutes: 13,
    textContent: "Une IA générative produit du texte, des images, du code ou des synthèses à partir d’une demande et du contexte fourni. Elle peut aider à préparer, reformuler, résumer, organiser ou proposer des pistes.\n\nElle ne remplace ni la connaissance du métier, ni la vérification, ni la décision humaine. Pour une information actuelle, demander une recherche adaptée puis contrôler directement les sources.\n\nExemples utiles : préparer une trame d’e-mail, classer des idées, créer un plan, résumer des notes fictives ou préparer une première version à relire.",
    trainerGuidance: "Objectif : expliquer comment une IA générative produit une réponse plausible.\n\nDéroulé : question d’ouverture, capsule 1, débrief, comparaison moteur de recherche / ChatGPT / Codex.\n\nQuestion : « Quelle partie reste sous la responsabilité humaine ? »\n\nMessage clé : une réponse bien rédigée peut être fausse.\n\nSolution de secours : utiliser la transcription si la vidéo n’est pas disponible.",
    videoUrl: null,
    pdfUrl: null,
    media: { expectedFileName: "01_De_l_idee_au_resultat.mp4", title: "De l’idée au résultat avec ChatGPT et Codex", durationSeconds: 60, transcript: "Quand on parle d’IA, on imagine parfois qu’il faut être informaticien. Je pars d’un besoin métier simple. Avec ChatGPT, je précise mon objectif, le contexte, le résultat attendu et les limites. Je relis ensuite le résultat et demande une correction ciblée. Avec Codex, je peux travailler dans un projet logiciel : lire les fichiers, proposer une modification et lancer des contrôles. L’IA accélère le travail, mais l’humain vérifie, corrige et garde la décision finale.", videoPath: "/training-media/01_De_l_idee_au_resultat.mp4" }
  },
  {
    key: "ai-04-two-prompts",
    order: 4,
    title: "Possibilités et limites",
    description: "Identifier des usages professionnels utiles et les contrôles associés.",
    estimatedMinutes: 7,
    textContent: "Tracer deux colonnes : « Utile » et « À contrôler ».\n\nÀ partir des idées du groupe, identifier deux ou trois tâches adaptées : résumé de réunion, préparation d’e-mail, comparaison de documents, création d’un plan ou extraction d’actions.\n\nPour chaque usage, demander ce qui peut mal se passer et qui doit relire le résultat. Partir d’une tâche et d’un résultat attendu, pas d’un outil à utiliser à tout prix.",
    trainerGuidance: "Objectif : faire émerger des usages professionnels réalistes.\n\nQuestion : « Quelle tâche répétitive, pénible ou longue aimeriez-vous lui confier demain ? »\n\nMessage clé : utile ne signifie pas autonome ; une personne contrôle le résultat.",
    videoUrl: null,
    pdfUrl: null
  },
  {
    key: "ai-05-chatgpt",
    order: 5,
    title: "Découvrir ChatGPT",
    description: "Utiliser une conversation pour préparer, préciser et améliorer un livrable.",
    estimatedMinutes: 15,
    textContent: "Dans une conversation, on peut poser une première demande, ajouter du contexte, demander un format, corriger le ton ou réduire la longueur.\n\nDémonstration : poser une question simple, ajouter le contexte et le format, demander une correction ciblée, puis demander de distinguer les faits, les incertitudes et les informations manquantes.\n\nPhrase à retenir : « La qualité vient du contexte, mais la confiance vient de la vérification. »",
    trainerGuidance: "Utiliser uniquement un compte et des contenus autorisés. Montrer volontairement une réponse imparfaite puis sa correction : une démonstration trop parfaite donne une fausse image de l’outil.",
    videoUrl: null,
    pdfUrl: null
  },
  {
    key: "ai-06-ocrl",
    order: 6,
    title: "Structurer une demande avec O-C-R-L",
    description: "Transformer une demande floue en demande exploitable et vérifiable.",
    estimatedMinutes: 20,
    textContent: "Méthode O-C-R-L :\n- Objectif : ce que je veux obtenir.\n- Contexte : les éléments utiles, la cible et la source.\n- Résultat attendu : format, longueur, ton, structure.\n- Limites : ce qui ne doit pas être inventé, les points à signaler et les vérifications attendues.\n\nExercice 1 : améliorer « Fais-moi un e-mail pour nos clients ». La version corrigée doit préciser le public, le sujet, le ton, la longueur, les données autorisées et ce qui doit être validé avant envoi.",
    trainerGuidance: "Objectif : utiliser O-C-R-L comme liste de contrôle.\n\nDéroulé : capsule 2, répétition collective, exemple avant/après, exercice 1 et correction.\n\nVigilance : « Tu es expert » peut orienter le ton, mais ne rend pas une information vraie.\n\nSolution de secours : lire la transcription puis réaliser l’exercice oralement.",
    videoUrl: null,
    pdfUrl: null,
    media: { expectedFileName: "02_Bon_prompt_OCRL.mp4", title: "Construire un bon prompt avec O-C-R-L", durationSeconds: 60, transcript: "Pour une tâche importante, retenez quatre repères : Objectif, Contexte, Résultat et Limites. Une demande vague oblige l’IA à deviner. Précisez le public, la source, le format, ce qui doit être conservé et ce qui doit être signalé. Vous n’avez pas besoin de réussir du premier coup : relisez, dites ce qui ne convient pas et demandez une correction ciblée. Un bon prompt donne une direction ; la vérification donne confiance.", videoPath: "/training-media/02_Bon_prompt_OCRL.mp4" }
  },
  {
    key: "ai-07-atlas",
    order: 7,
    title: "Exercice pratique : Projet Atlas",
    description: "Obtenir puis vérifier une synthèse à partir de notes fictives.",
    estimatedMinutes: 15,
    textContent: "Exercice 2 — Projet Atlas (données fictives).\n\nÀ partir de notes de réunion volontairement incomplètes, demander : une synthèse courte, les décisions, les actions, les responsables, les dates et une rubrique « à confirmer ».\n\nPuis demander : « Compare ton compte rendu aux notes originales. Liste toute information ajoutée, modifiée ou incertaine, puis fournis une version corrigée. Conserve mot pour mot les montants et les dates présents dans la source. »\n\nLe bon réflexe est de comparer le résultat à sa source et de corriger la trajectoire.",
    trainerGuidance: "Distribuer ou afficher des notes fictives. Relever avec le groupe les informations inventées, les contradictions et les données manquantes avant de montrer une relance de correction.",
    videoUrl: null,
    pdfUrl: null
  },
  {
    key: "ai-08-chatgpt-codex",
    order: 8,
    title: "ChatGPT, fichiers et Codex",
    description: "Distinguer la conversation, le travail sur fichier et le travail dans un projet de code.",
    estimatedMinutes: 12,
    textContent: "ChatGPT aide principalement dans une conversation et, selon les fonctions autorisées, sur des fichiers. Codex travaille dans un projet : il peut lire des fichiers, proposer ou réaliser des modifications, lancer des contrôles et résumer ce qui a changé.\n\nExemple de démonstration Codex dans un projet fictif : demander d’ajouter un encadré « Les 5 réflexes pour utiliser l’IA », sans modifier les autres pages, puis de lancer les contrôles et de résumer les fichiers modifiés.\n\nUne autorisation d’agir ne vaut jamais autorisation illimitée : le périmètre et la validation humaine restent nécessaires.",
    trainerGuidance: "Ne faire la démonstration Codex que dans un projet de démonstration. Montrer la lecture du projet, le contrôle des modifications et la relecture finale ; ne jamais présenter l’outil comme responsable juridiquement à la place de l’utilisateur.",
    videoUrl: null,
    pdfUrl: null
  },
  {
    key: "ai-09-responsible-use",
    order: 9,
    title: "Risques et usage responsable",
    description: "Protéger les données, vérifier les résultats et garder la décision humaine.",
    estimatedMinutes: 13,
    textContent: "Les cinq réflexes :\n1. Décrire clairement le résultat attendu.\n2. Protéger les données et respecter les règles de l’organisation.\n3. Vérifier faits, chiffres, sources, dates et citations.\n4. Corriger par le dialogue au lieu d’accepter la première réponse.\n5. Décider humainement avant d’envoyer, publier ou agir.\n\nMini-jeu : classer les cas en usage courant (vert), vigilance (orange) ou interdit sans cadre autorisé (rouge). Une liste nominative de clients, un dossier médical, un secret ou un mot de passe ne sont jamais à saisir dans un outil non autorisé. Une hallucination est une information fausse ou non fondée produite avec assurance : il faut la recouper.",
    trainerGuidance: "Objectif : repérer une hallucination et protéger les données.\n\nDéroulé : capsule 3, débrief, intervention « Protéger les données et garder la décision », mini-jeu vert/orange/rouge, synthèse.\n\nQuestion : « Quel détail rend une hallucination dangereuse ? » Réponse attendue : son apparence crédible.\n\nVigilance : orange signifie vérifier le cadre et les autorisations ; ce n’est pas automatiquement interdit.",
    videoUrl: null,
    pdfUrl: null,
    media: { expectedFileName: "03_Hallucinations_verifier.mp4", title: "Une réponse convaincante peut être fausse", durationSeconds: 60, transcript: "Une IA peut produire une réponse claire, précise et pourtant fausse : c’est une hallucination. Elle peut inventer un chiffre, une date, une référence ou un lien. Pour un sujet important, donnez une source fiable, demandez de distinguer les faits des incertitudes, puis ouvrez réellement les liens. Une phrase élégante n’est pas une preuve : la confiance vient de la vérification.", videoPath: "/training-media/03_Hallucinations_verifier.mp4" }
  },
  {
    key: "ai-10-final-quiz",
    order: 10,
    title: "Quiz final et correction",
    description: "Vérifier les acquis : objectif conseillé de 8 réponses justes sur 10.",
    estimatedMinutes: 9,
    textContent: "Quiz final de 10 questions. Objectif pédagogique : 8/10.\n\nEn cas de résultat inférieur, reprendre les explications puis proposer une seconde tentative. Le but est de comprendre les réflexes de travail, non de réciter un outil.\n\nBarème : 0 à 5, reprise guidée recommandée ; 6 à 7, bases en cours d’acquisition ; 8 à 9, objectifs atteints ; 10, très bonne maîtrise des fondamentaux.",
    trainerGuidance: "Présenter les réponses une fois les choix faits. Pour une évaluation formelle, conserver le meilleur score et le nombre de tentatives dans le dispositif d’évaluation dédié ; le mode formation sert ici de support d’animation.",
    videoUrl: null,
    pdfUrl: null
  },
  {
    key: "ai-11-wrap-up",
    order: 11,
    title: "Bilan et aide-mémoire",
    description: "Conclure par les cinq réflexes réutilisables dès demain.",
    estimatedMinutes: 4,
    textContent: "Aide-mémoire :\nAvant : ai-je le droit d’utiliser ces données ? quel résultat concret est attendu ?\nPendant : Objectif, Contexte, Résultat attendu, Limites et vérifications.\nAprès : vérifier faits, dates, chiffres, liens et citations ; signaler les incertitudes ; faire valider si nécessaire ; ne rien envoyer, publier ou exécuter sans accord explicite.\n\nRessources à revoir chaque année : documentation ChatGPT et prompting d’OpenAI, Commission européenne sur la culture IA, guide de sécurité des données personnelles de la CNIL.",
    trainerGuidance: "Faire formuler à chacun un usage concret et prudent à tester. Rappeler où retrouver les consignes internes de l’entreprise avant la mise en pratique.",
    videoUrl: null,
    pdfUrl: null
  }
];

export const AI_QUIZZES: TrainingQuizTemplate[] = [
  { moduleKey: "ai-02-diagnostic", question: "Une IA générative cherche-t-elle toujours sa réponse sur Internet ?", optionA: "Oui", optionB: "Non", optionC: "Seulement le lundi", optionD: "Uniquement avec un abonnement", correctAnswer: "B", explanation: "Elle ne recherche sur le Web que si l’outil et la demande le permettent." },
  { moduleKey: "ai-02-diagnostic", question: "Une réponse très bien rédigée est-elle forcément exacte ?", optionA: "Oui", optionB: "Non", optionC: "Seulement si elle est longue", optionD: "Seulement pour les e-mails", correctAnswer: "B", explanation: "La qualité de rédaction n’est pas une preuve : les faits importants doivent être contrôlés." },
  { moduleKey: "ai-02-diagnostic", question: "Peut-on demander à ChatGPT de reformuler sa réponse ?", optionA: "Oui", optionB: "Non", optionC: "Une seule fois", optionD: "Seulement à l’oral", correctAnswer: "A", explanation: "Le dialogue et l’itération font partie de l’usage normal." },
  { moduleKey: "ai-02-diagnostic", question: "Est-il prudent de coller une liste de clients dans un outil non autorisé ?", optionA: "Oui", optionB: "Non", optionC: "Uniquement le vendredi", optionD: "Oui si la liste est courte", correctAnswer: "B", explanation: "Il faut respecter le cadre de l’organisation et la protection des données." },
  { moduleKey: "ai-02-diagnostic", question: "Codex sert principalement à :", optionA: "Modifier et vérifier du code", optionB: "Réserver un billet d’avion", optionC: "Remplacer tous les développeurs", optionD: "Envoyer des e-mails sans contrôle", correctAnswer: "A", explanation: "Codex peut travailler dans les fichiers d’un projet et lancer des contrôles, sous supervision." },
  { moduleKey: "ai-02-diagnostic", question: "Quel comportement est le plus utile ?", optionA: "Chercher le prompt magique", optionB: "Donner le contexte puis vérifier et corriger", optionC: "Accepter la première réponse", optionD: "Ne jamais relancer l’outil", correctAnswer: "B", explanation: "Le contexte, la vérification et le dialogue permettent d’améliorer le résultat." },
  { moduleKey: "ai-10-final-quiz", question: "Une IA générative :", optionA: "retrouve toujours une réponse exacte dans une base certifiée", optionB: "produit du contenu à partir d’une demande et de son contexte", optionC: "ne peut produire que du texte", optionD: "remplace automatiquement l’expertise humaine", correctAnswer: "B", explanation: "Elle produit du contenu ; l’expertise et la vérification humaines restent nécessaires." },
  { moduleKey: "ai-10-final-quiz", question: "Quel prompt est le plus exploitable ?", optionA: "Fais un compte rendu.", optionB: "Fais quelque chose de professionnel.", optionC: "À partir de ces notes, produis un compte rendu de 200 mots, décisions d’abord, puis actions avec responsables et dates ; signale les informations manquantes.", optionD: "Tu es la meilleure IA du monde, devine ce que je veux.", correctAnswer: "C", explanation: "Il fournit la source, le format, les priorités et la limite à respecter." },
  { moduleKey: "ai-10-final-quiz", question: "Dans O-C-R-L, le L correspond à :", optionA: "Langage", optionB: "Limites", optionC: "Logiciel", optionD: "Lecture", correctAnswer: "B", explanation: "Les limites précisent ce qui doit être vérifié, signalé ou exclu." },
  { moduleKey: "ai-10-final-quiz", question: "Une réponse cite un rapport et donne un lien. Que faire si l’information est importante ?", optionA: "Considérer le lien comme une preuve suffisante", optionB: "Vérifier que la source existe et confirme réellement l’affirmation", optionC: "Supprimer le lien", optionD: "Demander une réponse plus longue", correctAnswer: "B", explanation: "Il faut ouvrir et contrôler la source, pas seulement son apparence." },
  { moduleKey: "ai-10-final-quiz", question: "Quelle donnée ne doit pas être saisie dans un outil non autorisé ?", optionA: "Le thème public d’une brochure", optionB: "Une idée de slogan fictive", optionC: "Une liste nominative de clients avec coordonnées", optionD: "Une phrase inventée pour un exercice", correctAnswer: "C", explanation: "Les données personnelles nécessitent un cadre et un outil autorisé." },
  { moduleKey: "ai-10-final-quiz", question: "Pour une information susceptible d’avoir changé récemment, la bonne pratique est de :", optionA: "demander une recherche actuelle et contrôler les sources", optionB: "faire confiance à la mémoire supposée du modèle", optionC: "choisir la réponse la plus longue", optionD: "reposer exactement la même question dix fois", correctAnswer: "A", explanation: "Une source actuelle et contrôlée est nécessaire." },
  { moduleKey: "ai-10-final-quiz", question: "Que faire si le document source contient deux montants contradictoires ?", optionA: "Choisir le montant le plus élevé", optionB: "Calculer une moyenne", optionC: "Signaler la contradiction et demander confirmation", optionD: "Supprimer les deux montants sans le dire", correctAnswer: "C", explanation: "Une contradiction doit être signalée, pas devinée." },
  { moduleKey: "ai-10-final-quiz", question: "Codex se distingue d’une simple conversation parce qu’il peut notamment :", optionA: "garantir qu’aucune erreur n’existera", optionB: "lire et modifier les fichiers d’un projet puis lancer des contrôles", optionC: "publier toute modification sans validation", optionD: "prendre la responsabilité juridique du logiciel", correctAnswer: "B", explanation: "Il travaille sur un projet, mais la relecture et la validation humaine restent indispensables." },
  { moduleKey: "ai-10-final-quiz", question: "Avant d’envoyer un e-mail préparé par une IA, il faut :", optionA: "le relire, vérifier ses faits, ses destinataires et son ton", optionB: "l’envoyer automatiquement puisqu’il est bien écrit", optionC: "enlever toute ponctuation", optionD: "demander au modèle s’il est certain à 100 %", correctAnswer: "A", explanation: "La personne qui envoie conserve la responsabilité du message." },
  { moduleKey: "ai-10-final-quiz", question: "L’objectif principal d’une initiation à l’IA en entreprise est de :", optionA: "mémoriser tous les noms de modèles", optionB: "savoir tout automatiser immédiatement", optionC: "utiliser l’IA de manière utile, critique et responsable dans son contexte", optionD: "remplacer les procédures de l’organisation", correctAnswer: "C", explanation: "L’enjeu est de développer des pratiques utiles, critiques et responsables." }
];

export function getAiModuleTotalMinutes() {
  return AI_MODULES.reduce((total, module) => total + (module.estimatedMinutes ?? 0), 0);
}
