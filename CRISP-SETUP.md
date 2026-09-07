# Aircraft2Sell — Scénarios de réponse pour Crisp

Source unique de vérité : `faq.html` (JSON-LD). Si la FAQ change, régénérer
ce fichier avec `python3 scripts/gen-crisp-faq.py` et réimporter dans Crisp.

## Installation (5 minutes)

1. Créer un compte sur https://crisp.chat (plan gratuit suffisant).
2. Paramètres > Paramètres du site > copier l'**Identifiant du site**.
3. Coller cet identifiant dans `chat.js`, variable `CRISP_WEBSITE_ID`.
   Tant qu'elle est vide, le chat est totalement inerte (aucune requête réseau).
4. Crisp > Paramètres > Chatbot (ou Réponses rapides) : créer un scénario par
   entrée ci-dessous, en collant les mots-clés et la réponse.
5. Boîte de réception > Paramètres : brancher `contact@aircraft2sell.eu` pour
   recevoir les conversations manquées par email.

## Réglages recommandés

- **Langue** : le widget suit `document.documentElement.lang` (fr/en/de/it/es).
- **Message d'absence** : « Nous répondons sous 24 h ouvrées. Laissez-nous votre
  email et nous revenons vers vous. »
- **RGPD** : activer l'anonymisation IP et la rétention à 6 mois
  (Crisp héberge en UE, cohérent avec la politique de confidentialité du site).

---

## Réponses rapides

### Comment contacter un vendeur ?
*Mots-clés :* contacter, vendeur, message, joindre, appeler

Sur chaque page d'annonce, cliquez sur le bouton "Contacter le vendeur". Un formulaire s'ouvre : renseignez votre nom, email, téléphone (optionnel) et votre message. Le vendeur reçoit une notification par email et peut vous répondre directement. Aucun compte n'est requis pour contacter un vendeur.

### Les annonces sont-elles vérifiées ?
*Mots-clés :* vérifiée, fiable, arnaque, confiance, sécurité, escroquerie

Oui. Chaque annonce est validée manuellement par notre équipe avant publication. Nous vérifions la cohérence des informations (catégorie, prix, description) mais nous ne procédons pas à une inspection physique de l'aéronef. Nous recommandons toujours une inspection pré-achat indépendante par un AMO agréé avant tout engagement.

### Aircraft2Sell prend-il une commission sur les ventes ?
*Mots-clés :* commission, frais, pourcentage, gratuit, coût, tarif, prix du service

Zéro commission. Aircraft2Sell est une plateforme de mise en relation. Nous ne prélevons aucun pourcentage sur les transactions. Le prix de vente est intégralement reversé au vendeur. Notre modèle économique repose uniquement sur les abonnements des vendeurs professionnels.

### Comment créer une alerte pour être notifié de nouvelles annonces ?

Sur la page d'accueil, renseignez votre email dans la section "Alertes", sélectionnez une catégorie et un budget maximum, puis cliquez sur "Créer mon alerte". Vous recevrez un email dès qu'une annonce correspondant à vos critères est publiée. La désinscription se fait en un clic depuis chaque email reçu.

### Puis-je sauvegarder des annonces en favoris ?

Oui. Sur les cartes d'annonces, cliquez sur l'icône cœur pour ajouter une annonce à vos favoris. Vos favoris sont sauvegardés localement dans votre navigateur et persistent entre les visites. Un compte gratuit permet de les retrouver sur tous vos appareils.

### Les prix sont-ils négociables ?

Aircraft2Sell n'intervient pas dans la négociation : elle se fait entièrement entre vous et le vendeur. Certaines annonces mentionnent explicitement que le prix est "négociable" ou "ferme". N'hésitez pas à demander directement au vendeur sa marge de négociation, en justifiant votre offre par des éléments objectifs (heures moteur, état, valeur AVAC).

### Comment déposer une annonce ?
*Mots-clés :* déposer, publier, poster, mettre en vente, vendre, annonce

Créez un compte gratuit, puis cliquez sur "Déposer une annonce" dans la navigation. Remplissez le formulaire (catégorie, marque, modèle, année, prix, description, photos) et soumettez. Votre annonce est validée par notre équipe sous 24 à 72 heures ouvrées, puis publiée automatiquement.

### Combien d'annonces puis-je publier ?

Cela dépend de votre formule : Essentiel (gratuit) : 1 annonce active. Aviateur (29 €/mois) : 3 annonces. Pro (79 €/mois) : annonces illimitées. Vous pouvez passer à une formule supérieure à tout moment depuis votre tableau de bord.

### Pourquoi mon annonce n'a pas été validée ?
*Mots-clés :* validation, refusée, rejetée, délai, en attente, modération

Nous rejetons les annonces qui ne respectent pas nos règles : informations incomplètes ou inexactes, photos insuffisantes ou trompeuses, prix incohérent avec la catégorie, annonce en doublon. Vous recevez un email expliquant le motif du rejet et vous pouvez corriger et resoumettre depuis votre tableau de bord.

### Combien de photos puis-je ajouter ?

Formule Essentiel : jusqu'à 5 photos. Formule Aviateur : jusqu'à 20 photos. Formule Pro : photos illimitées. Nous recommandons au minimum 6 photos couvrant l'extérieur (3/4 avant, 3/4 arrière, profil), le cockpit, le moteur et les documents. Des photos de qualité augmentent nettement le nombre de contacts reçus.

### Comment modifier ou supprimer mon annonce ?

Depuis votre tableau de bord (onglet "Mes annonces"), cliquez sur l'annonce à modifier. Vous pouvez éditer toutes les informations, ajouter ou supprimer des photos, et archiver ou supprimer l'annonce. Si l'avion est vendu, marquez-le comme "Vendu" plutôt que de supprimer l'annonce : cela renforce la crédibilité de la plateforme.

### Qui voit mon adresse email et mon téléphone ?

Votre email n'est jamais affiché publiquement sur les annonces. Seul votre pseudo public est visible. Votre email est transmis aux acheteurs uniquement lorsqu'ils vous contactent via le formulaire de contact, pour que vous puissiez répondre directement. Votre numéro de téléphone n'est partagé que si vous choisissez de l'indiquer dans votre annonce.

### La création de compte est-elle gratuite ?
*Mots-clés :* compte, inscription, gratuit, créer un compte, mot de passe

Oui, entièrement gratuite. La formule Essentiel vous permet de publier 1 annonce, de recevoir des messages d'acheteurs et d'accéder à votre tableau de bord. Aucune carte bancaire n'est requise pour s'inscrire.

### Comment résilier mon abonnement ?
*Mots-clés :* abonnement, résilier, formule, plan, mensuel, facture, paiement

Depuis votre tableau de bord, onglet "Abonnement", cliquez sur "Résilier mon abonnement". La résiliation est effective à la fin de la période en cours : vous conservez l'accès à toutes les fonctionnalités jusqu'à la fin de la période payée. Aucun préavis minimum n'est requis.

### Comment changer mon pseudo ?

Dans votre tableau de bord, onglet "Paramètres", modifiez votre pseudo dans le champ dédié et cliquez sur "Enregistrer". Le changement est immédiat sur votre profil, mais les annonces déjà publiées conservent l'ancien pseudo jusqu'à leur prochaine mise à jour.

### J'ai oublié mon mot de passe, que faire ?

Sur la page de connexion, cliquez sur "Mot de passe oublié ?". Entrez votre email et vous recevrez un lien de réinitialisation valable 1 heure. Si vous ne recevez pas l'email, vérifiez vos spams ou contactez-nous à contact@aircraft2sell.eu.

### Le site fonctionne-t-il sur mobile ?

Oui. Aircraft2Sell est entièrement responsive et optimisé pour mobile et tablette. Toutes les fonctionnalités (recherche, filtres, contact vendeur, dépôt d'annonce) sont accessibles depuis un smartphone. L'envoi de photos depuis la galerie de votre téléphone est pris en charge.

### Quels formats de photos sont acceptés ?

Formats acceptés : JPG, JPEG, PNG. Taille maximum : 10 Mo par photo. Nous recommandons des photos horizontales en format 4:3 ou 16:9, d'une résolution minimale de 1280×720 pixels. Les photos floues, trop sombres ou prises de très loin sont refusées lors de la validation.

### Le convertisseur de devises est-il fiable ?

Le convertisseur utilise des taux de change fournis par des API publiques (taux indicatifs proches de la Banque Centrale Européenne, mis à jour régulièrement). Ces taux sont indicatifs : pour une transaction, utilisez toujours le taux de votre banque ou d'un service de change spécialisé.

### Aircraft2Sell affiche-t-il des publicités ?

Non. Aircraft2Sell est entièrement sans publicité. Notre modèle économique repose sur les abonnements vendeurs : nous n'affichons jamais de bannières, pop-ups ou contenu sponsorisé.

### Comment signaler une annonce suspecte ?

Sur chaque page d'annonce, cliquez sur le lien "Signaler" en bas de page. Vous pouvez aussi nous contacter directement à contact@aircraft2sell.eu avec le lien de l'annonce et le motif du signalement. Nous traitons tous les signalements sous 24 h.

### Mes données personnelles sont-elles protégées ?
*Mots-clés :* rgpd, données, confidentialité, vie privée, personnelles

Oui. Aircraft2Sell est conforme au RGPD. Vos données sont hébergées sur des serveurs sécurisés (Supabase / Cloudflare) et ne sont jamais vendues à des tiers. Vous pouvez exercer vos droits (accès, rectification, suppression) à tout moment. Consultez notre politique de confidentialité complète.

---

## Escalade vers un humain

Si la question sort de ce périmètre (litige, dossier technique précis,
demande professionnelle), répondre :

> Je transmets votre demande à l'équipe Aircraft2Sell. Laissez-nous votre
> email et nous vous répondons sous 24 h ouvrées — ou écrivez directement
> à contact@aircraft2sell.eu.
