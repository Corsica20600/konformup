update public.training_modules
set
  trainer_guidance = $guidance$Objectif : expliquer comment une IA générative produit une réponse plausible.

Déroulé : question d’ouverture, capsule 1, débrief, comparaison moteur de recherche / ChatGPT / Codex.

Question : « Quelle partie reste sous la responsabilité humaine ? »

Message clé : une réponse bien rédigée peut être fausse.

Solution de secours : utiliser la transcription si la vidéo n’est pas disponible.$guidance$
where training_type = 'ai' and module_key = 'ai-03-generative-ai';

update public.training_modules
set
  title = 'Possibilités et limites',
  summary = 'Identifier des usages professionnels utiles et les contrôles associés.',
  content_text = $content$Tracer deux colonnes : « Utile » et « À contrôler ».

À partir des idées du groupe, identifier deux ou trois tâches adaptées : résumé de réunion, préparation d’e-mail, comparaison de documents, création d’un plan ou extraction d’actions.

Pour chaque usage, demander ce qui peut mal se passer et qui doit relire le résultat. Partir d’une tâche et d’un résultat attendu, pas d’un outil à utiliser à tout prix.$content$,
  trainer_guidance = $guidance$Objectif : faire émerger des usages professionnels réalistes.

Question : « Quelle tâche répétitive, pénible ou longue aimeriez-vous lui confier demain ? »

Message clé : utile ne signifie pas autonome ; une personne contrôle le résultat.$guidance$
where training_type = 'ai' and module_key = 'ai-04-two-prompts';

update public.training_modules
set
  trainer_guidance = $guidance$Objectif : utiliser O-C-R-L comme liste de contrôle.

Déroulé : capsule 2, répétition collective, exemple avant/après, exercice 1 et correction.

Vigilance : « Tu es expert » peut orienter le ton, mais ne rend pas une information vraie.

Solution de secours : lire la transcription puis réaliser l’exercice oralement.$guidance$
where training_type = 'ai' and module_key = 'ai-06-ocrl';

update public.training_modules
set
  trainer_guidance = $guidance$Objectif : repérer une hallucination et protéger les données.

Déroulé : capsule 3, débrief, intervention « Protéger les données et garder la décision », mini-jeu vert/orange/rouge, synthèse.

Question : « Quel détail rend une hallucination dangereuse ? » Réponse attendue : son apparence crédible.

Vigilance : orange signifie vérifier le cadre et les autorisations ; ce n’est pas automatiquement interdit.$guidance$
where training_type = 'ai' and module_key = 'ai-09-responsible-use';
