update public.training_modules
set
  content_text = $content$Bienvenue dans l’initiation à l’intelligence artificielle.

Une IA désigne un ensemble de techniques qui permettent à une machine de reconnaître, classer, prévoir ou proposer un contenu. Nous en utilisons déjà au quotidien : GPS, filtre anti-spam, recommandations de films ou de musique, reconnaissance faciale, traduction automatique.

L’IA classique analyse surtout des données ; l’IA générative peut aussi produire du texte, une image, un son, une vidéo ou du code à partir d’une demande. Une réponse bien rédigée peut toutefois être fausse : pendant cette séance, nous allons profiter de sa vitesse sans lui abandonner notre jugement.

Objectifs : comprendre ce qu’est une IA générative, repérer des usages professionnels utiles, structurer une demande avec O-C-R-L, vérifier un résultat et protéger les informations de l’entreprise. Les exemples et exercices utilisent uniquement des données fictives.$content$,
  trainer_guidance = $guidance$Objectif : donner une définition simple de l’IA et poser le cadre de la séance.

Texte à dire : l’IA n’est ni un robot qui sait tout, ni une intelligence humaine enfermée dans un ordinateur. Elle réalise des tâches pour lesquelles nous mobilisons habituellement certaines capacités humaines.

Question au groupe : « Pouvez-vous citer une IA que vous utilisez déjà dans votre quotidien ? »

Réponses possibles : GPS, recommandations, filtre anti-spam, reconnaissance faciale, traduction automatique, assistant vocal.

Message clé : l’IA générative ajoute la capacité de produire, mais elle ne garantit ni vérité ni jugement.

Transition : « Voyons maintenant ce que vous en pensez déjà et ce qu’elle peut réellement faire. »$guidance$
where training_type = 'ai' and module_key = 'ai-01-welcome';
