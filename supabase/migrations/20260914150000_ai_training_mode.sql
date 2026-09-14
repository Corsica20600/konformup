-- Isolate reusable training content by training type. Existing shared content was SST content.
alter table public.training_modules
  add column if not exists training_type text not null default 'sst_initial',
  add column if not exists module_key text;

update public.training_modules
set training_type = 'sst_initial'
where training_type is null or btrim(training_type) = '';

create unique index if not exists training_modules_training_type_module_key_unique
  on public.training_modules(training_type, module_key)
  where module_key is not null;

with modules(module_key, module_order, title, summary, estimated_minutes, content_text, trainer_guidance) as (
  values
    ('ai-01-welcome', 1, 'Accueil et objectifs', 'Poser le cadre, les objectifs et le déroulé des deux heures.', 5, 'Bienvenue dans l''initiation à l''intelligence artificielle.\n\nObjectifs : comprendre ce qu''est une IA générative, repérer des usages professionnels utiles, structurer une demande avec O-C-R-L, vérifier un résultat et protéger les informations de l''entreprise.\n\nRègle de la séance : les exemples et exercices utilisent uniquement des données fictives.', 'Présenter le déroulé en 120 minutes. Demander les attentes concrètes du groupe, sans recueillir de donnée personnelle ou confidentielle.'),
    ('ai-02-diagnostic', 2, 'Diagnostic initial', 'Faire émerger les représentations et les bons réflexes avant l''apport.', 7, 'Quiz diagnostic non noté : répondre collectivement puis commenter les réponses.\n\nÀ retenir : une IA générative ne cherche pas automatiquement sur Internet ; une réponse bien écrite n''est pas forcément exacte ; on peut toujours demander une correction ; les données client ne vont pas dans un outil non autorisé ; Codex sert à travailler dans un projet de code ; le contexte, la vérification et le dialogue sont plus utiles qu''un « prompt magique ».', 'Ne pas noter ce quiz. Faire verbaliser les intuitions, puis annoncer que les réponses seront reprises au fil de la séance.'),
    ('ai-03-generative-ai', 3, 'Comprendre l''IA générative', 'Définir l''IA générative et distinguer ses usages de la recherche et de l''expertise humaine.', 13, 'Une IA générative produit du texte, des images, du code ou des synthèses à partir d''une demande et du contexte fourni. Elle peut aider à préparer, reformuler, résumer, organiser ou proposer des pistes.\n\nElle ne remplace ni la connaissance du métier, ni la vérification, ni la décision humaine. Pour une information actuelle, demander une recherche adaptée puis contrôler directement les sources.\n\nExemples utiles : préparer une trame d''e-mail, classer des idées, créer un plan, résumer des notes fictives ou préparer une première version à relire.', 'Limiter l''exposé. Demander au groupe trois usages possibles dans son activité, puis distinguer l''aide à la préparation de la décision finale.'),
    ('ai-04-two-prompts', 4, 'Même tâche, deux demandes', 'Comparer une demande vague et une demande structurée.', 7, 'Démonstration ou vidéo de trois minutes à préparer : « Une même tâche, deux prompts ».\n\nComparer : « Fais un compte rendu professionnel. » puis une demande précisant les notes fictives, la longueur, les décisions, les actions et les informations manquantes.\n\nLe résultat dépend de la clarté du contexte, du format demandé et des limites données. Média à ajouter : aucune vidéo externe n''est intégrée automatiquement.', 'Si la vidéo interne n''est pas disponible, faire la comparaison en direct. Ne pas utiliser de lien fictif.'),
    ('ai-05-chatgpt', 5, 'Découvrir ChatGPT', 'Utiliser une conversation pour préparer, préciser et améliorer un livrable.', 15, 'Dans une conversation, on peut poser une première demande, ajouter du contexte, demander un format, corriger le ton ou réduire la longueur.\n\nDémonstration : poser une question simple, ajouter le contexte et le format, demander une correction ciblée, puis demander de distinguer les faits, les incertitudes et les informations manquantes.\n\nPhrase à retenir : « La qualité vient du contexte, mais la confiance vient de la vérification. »', 'Utiliser uniquement un compte et des contenus autorisés. Montrer volontairement une réponse imparfaite puis sa correction.'),
    ('ai-06-ocrl', 6, 'Structurer une demande avec O-C-R-L', 'Transformer une demande floue en demande exploitable et vérifiable.', 20, 'Méthode O-C-R-L : Objectif, Contexte, Résultat attendu, Limites.\n\nExercice 1 : améliorer « Fais-moi un e-mail pour nos clients ». La version corrigée doit préciser le public, le sujet, le ton, la longueur, les données autorisées et ce qui doit être validé avant envoi.', 'Faire travailler en binômes. « Tu es expert » peut orienter le ton, mais ne rend pas une information vraie.'),
    ('ai-07-atlas', 7, 'Exercice pratique : Projet Atlas', 'Obtenir puis vérifier une synthèse à partir de notes fictives.', 15, 'Exercice 2 — Projet Atlas (données fictives).\n\nDemander une synthèse courte, les décisions, les actions, les responsables, les dates et une rubrique « à confirmer ». Puis comparer le compte rendu aux notes originales, lister toute information ajoutée, modifiée ou incertaine, et fournir une version corrigée.', 'Distribuer ou afficher des notes fictives. Relever avec le groupe les informations inventées, les contradictions et les données manquantes.'),
    ('ai-08-chatgpt-codex', 8, 'ChatGPT, fichiers et Codex', 'Distinguer la conversation, le travail sur fichier et le travail dans un projet de code.', 12, 'ChatGPT aide principalement dans une conversation et, selon les fonctions autorisées, sur des fichiers. Codex travaille dans un projet : il peut lire des fichiers, proposer ou réaliser des modifications, lancer des contrôles et résumer ce qui a changé.\n\nUne autorisation d''agir ne vaut jamais autorisation illimitée : le périmètre et la validation humaine restent nécessaires.', 'Ne faire la démonstration Codex que dans un projet fictif. Montrer la lecture du projet, les contrôles et la relecture finale.'),
    ('ai-09-responsible-use', 9, 'Risques et usage responsable', 'Protéger les données, vérifier les résultats et garder la décision humaine.', 13, 'Les cinq réflexes : décrire, protéger, vérifier, corriger et décider humainement.\n\nMini-jeu : classer les cas en usage courant (vert), vigilance (orange) ou interdit sans cadre autorisé (rouge). Une liste nominative de clients, un dossier médical, un secret ou un mot de passe ne sont jamais à saisir dans un outil non autorisé.', 'Faire classer les cas avant d''afficher la correction. Les règles internes et les outils autorisés priment toujours.'),
    ('ai-10-final-quiz', 10, 'Quiz final et correction', 'Vérifier les acquis : objectif conseillé de 8 réponses justes sur 10.', 9, 'Quiz final de 10 questions. Objectif pédagogique : 8/10.\n\nEn cas de résultat inférieur, reprendre les explications puis proposer une seconde tentative.\n\nBarème : 0 à 5, reprise guidée recommandée ; 6 à 7, bases en cours d''acquisition ; 8 à 9, objectifs atteints ; 10, très bonne maîtrise des fondamentaux.', 'Présenter les réponses après les choix. Le mode formation sert de support d''animation ; l''évaluation formelle reste tracée dans le dispositif dédié.'),
    ('ai-11-wrap-up', 11, 'Bilan et aide-mémoire', 'Conclure par les cinq réflexes réutilisables dès demain.', 4, 'Aide-mémoire : avant, vérifier le droit d''utiliser les données et le résultat attendu ; pendant, utiliser O-C-R-L ; après, vérifier faits, dates, chiffres, liens et citations, puis ne rien envoyer, publier ou exécuter sans accord explicite.', 'Faire formuler à chacun un usage concret et prudent à tester. Rappeler où retrouver les consignes internes de l''entreprise.')
)
insert into public.training_modules (training_type, module_key, title, summary, module_order, estimated_minutes, content_text, trainer_guidance, module_type, is_active)
select 'ai', module_key, title, summary, module_order, estimated_minutes, content_text, trainer_guidance, 'child', true
from modules
where not exists (
  select 1 from public.training_modules existing
  where existing.training_type = 'ai' and existing.module_key = modules.module_key
);

with quizzes(module_key, question, option_a, option_b, option_c, option_d, correct_answer, explanation) as (
  values
    ('ai-02-diagnostic', 'Une IA générative cherche-t-elle toujours sa réponse sur Internet ?', 'Oui', 'Non', 'Seulement le lundi', 'Uniquement avec un abonnement', 'B', 'Elle ne recherche sur le Web que si l''outil et la demande le permettent.'),
    ('ai-02-diagnostic', 'Une réponse très bien rédigée est-elle forcément exacte ?', 'Oui', 'Non', 'Seulement si elle est longue', 'Seulement pour les e-mails', 'B', 'La qualité de rédaction n''est pas une preuve : les faits importants doivent être contrôlés.'),
    ('ai-02-diagnostic', 'Peut-on demander à ChatGPT de reformuler sa réponse ?', 'Oui', 'Non', 'Une seule fois', 'Seulement à l''oral', 'A', 'Le dialogue et l''itération font partie de l''usage normal.'),
    ('ai-02-diagnostic', 'Est-il prudent de coller une liste de clients dans un outil non autorisé ?', 'Oui', 'Non', 'Uniquement le vendredi', 'Oui si la liste est courte', 'B', 'Il faut respecter le cadre de l''organisation et la protection des données.'),
    ('ai-02-diagnostic', 'Codex sert principalement à :', 'Modifier et vérifier du code', 'Réserver un billet d''avion', 'Remplacer tous les développeurs', 'Envoyer des e-mails sans contrôle', 'A', 'Codex peut travailler dans les fichiers d''un projet et lancer des contrôles, sous supervision.'),
    ('ai-02-diagnostic', 'Quel comportement est le plus utile ?', 'Chercher le prompt magique', 'Donner le contexte puis vérifier et corriger', 'Accepter la première réponse', 'Ne jamais relancer l''outil', 'B', 'Le contexte, la vérification et le dialogue permettent d''améliorer le résultat.'),
    ('ai-10-final-quiz', 'Une IA générative :', 'retrouve toujours une réponse exacte dans une base certifiée', 'produit du contenu à partir d''une demande et de son contexte', 'ne peut produire que du texte', 'remplace automatiquement l''expertise humaine', 'B', 'Elle produit du contenu ; l''expertise et la vérification humaines restent nécessaires.'),
    ('ai-10-final-quiz', 'Quel prompt est le plus exploitable ?', 'Fais un compte rendu.', 'Fais quelque chose de professionnel.', 'À partir de ces notes, produis un compte rendu de 200 mots, décisions d''abord, puis actions avec responsables et dates ; signale les informations manquantes.', 'Tu es la meilleure IA du monde, devine ce que je veux.', 'C', 'Il fournit la source, le format, les priorités et la limite à respecter.'),
    ('ai-10-final-quiz', 'Dans O-C-R-L, le L correspond à :', 'Langage', 'Limites', 'Logiciel', 'Lecture', 'B', 'Les limites précisent ce qui doit être vérifié, signalé ou exclu.'),
    ('ai-10-final-quiz', 'Une réponse cite un rapport et donne un lien. Que faire si l''information est importante ?', 'Considérer le lien comme une preuve suffisante', 'Vérifier que la source existe et confirme réellement l''affirmation', 'Supprimer le lien', 'Demander une réponse plus longue', 'B', 'Il faut ouvrir et contrôler la source, pas seulement son apparence.'),
    ('ai-10-final-quiz', 'Quelle donnée ne doit pas être saisie dans un outil non autorisé ?', 'Le thème public d''une brochure', 'Une idée de slogan fictive', 'Une liste nominative de clients avec coordonnées', 'Une phrase inventée pour un exercice', 'C', 'Les données personnelles nécessitent un cadre et un outil autorisé.'),
    ('ai-10-final-quiz', 'Pour une information susceptible d''avoir changé récemment, la bonne pratique est de :', 'demander une recherche actuelle et contrôler les sources', 'faire confiance à la mémoire supposée du modèle', 'choisir la réponse la plus longue', 'reposer exactement la même question dix fois', 'A', 'Une source actuelle et contrôlée est nécessaire.'),
    ('ai-10-final-quiz', 'Que faire si le document source contient deux montants contradictoires ?', 'Choisir le montant le plus élevé', 'Calculer une moyenne', 'Signaler la contradiction et demander confirmation', 'Supprimer les deux montants sans le dire', 'C', 'Une contradiction doit être signalée, pas devinée.'),
    ('ai-10-final-quiz', 'Codex se distingue d''une simple conversation parce qu''il peut notamment :', 'garantir qu''aucune erreur n''existera', 'lire et modifier les fichiers d''un projet puis lancer des contrôles', 'publier toute modification sans validation', 'prendre la responsabilité juridique du logiciel', 'B', 'Il travaille sur un projet, mais la relecture et la validation humaine restent indispensables.'),
    ('ai-10-final-quiz', 'Avant d''envoyer un e-mail préparé par une IA, il faut :', 'le relire, vérifier ses faits, ses destinataires et son ton', 'l''envoyer automatiquement puisqu''il est bien écrit', 'enlever toute ponctuation', 'demander au modèle s''il est certain à 100 %', 'A', 'La personne qui envoie conserve la responsabilité du message.'),
    ('ai-10-final-quiz', 'L''objectif principal d''une initiation à l''IA en entreprise est de :', 'mémoriser tous les noms de modèles', 'savoir tout automatiser immédiatement', 'utiliser l''IA de manière utile, critique et responsable dans son contexte', 'remplacer les procédures de l''organisation', 'C', 'L''enjeu est de développer des pratiques utiles, critiques et responsables.')
)
insert into public.training_quizzes (module_id, question, option_a, option_b, option_c, option_d, correct_answer, explanation)
select modules.id, quizzes.question, quizzes.option_a, quizzes.option_b, quizzes.option_c, quizzes.option_d, quizzes.correct_answer, quizzes.explanation
from quizzes
join public.training_modules modules on modules.training_type = 'ai' and modules.module_key = quizzes.module_key
where not exists (
  select 1 from public.training_quizzes existing
  where existing.module_id = modules.id and existing.question = quizzes.question
);

-- Remove the old SST progress rows from AI sessions, then attach the IA programme.
delete from public.session_module_progress progress
using public.training_sessions session, public.training_modules module
where progress.session_id = session.id
  and progress.module_id = module.id
  and session.training_type = 'ai'
  and module.training_type <> 'ai';

insert into public.session_module_progress (session_id, module_id)
select session.id, module.id
from public.training_sessions session
cross join public.training_modules module
where session.training_type = 'ai'
  and module.training_type = 'ai'
  and module.is_active = true
on conflict (session_id, module_id) do nothing;
