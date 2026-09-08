# Notifications par email

Le site envoie quatre types de notifications transactionnelles.

| Événement | Destinataire | Fonction |
|---|---|---|
| Annonce déposée | administrateur | `api/notify-new-listing.js` |
| Annonce validée | vendeur | `api/notify-listing-moderated.js` |
| Annonce refusée (avec motif) | vendeur | `api/notify-listing-moderated.js` |
| Message reçu | destinataire | `api/notify-message.js` |

## Pourquoi des fonctions Vercel

Le site appelait trois fonctions Edge Supabase — `notify-new-listing`,
`notify-listing-approved`, `send-listing-message`. **Aucune n'a jamais été
déployée** : les quatre fonctions du projet, y compris `contact`, répondent
HTTP 404. Aucun email n'était donc envoyé.

Le déploiement Supabase demande le CLI et un jeton d'accès dont nous ne
disposons pas. La chaîne Vercel, elle, fonctionne : les fonctions `api/`
partent avec le site à chaque push.

La clé Brevo reste côté serveur — elle n'apparaît jamais dans le navigateur.

## ⚠️ Restriction IP Brevo — à désactiver

En production, Brevo refuse les envois :

```
401 — We have detected you are using an unrecognised IP address 3.89.99.22
```

La restriction **« Authorised IPs »** est active sur le compte. Les fonctions
serverless Vercel n'ont **pas d'IP fixe** : impossible de les déclarer.

**Correction** (une fois, 30 secondes) :
1. https://app.brevo.com/security/authorised_ips
2. Désactiver la restriction, ou supprimer l'IP `51.75.251.127` qui la déclenche.

Sans cette étape, les emails partent en local mais pas depuis le site.

## Vérifier

```bash
# Configuration en production, sans envoyer d'email
curl "https://aircraft2sell.eu/api/diag-email"

# Suite complète, avec envois réels
node scripts/test-emails.mjs contact@aircraft2sell.eu

# Sans rien envoyer
node scripts/test-emails.mjs --dry
```

`test-emails.mjs` couvre 12 cas : CORS, méthodes refusées, les quatre
notifications, et les rejets attendus (annonce inexistante, message vide,
auto-notification).

## Variables d'environnement Vercel

| Variable | Rôle |
|---|---|
| `BREVO_API_KEY` | clé API Brevo |
| `BREVO_FROM` | expéditeur (`contact@aircraft2sell.eu`) |
| `SUPABASE_URL` | relecture des annonces |
| `SUPABASE_SERVICE_ROLE_KEY` | idem, contourne la RLS |
| `ADMIN_EMAIL` | destinataire des alertes |
| `ADMIN_DIAG_KEY` | *(optionnel)* protège `/api/diag-email` |

Ajout : `vercel env add <NOM> production`.

## Choix de conception

- **Les annonces sont relues en base** avant envoi : le contenu transmis par
  le navigateur peut être incomplet ou falsifié.
- **Contenu utilisateur échappé** (`esc`) : ces emails affichent du texte
  libre écrit par des tiers.
- **`replyTo` pointe sur l'expéditeur réel** : le vendeur répond directement
  depuis sa boîte, sans passer par le site.
- **Auto-notification évitée** : on ne s'envoie pas d'email à soi-même.
- **Échec silencieux côté site** : un email qui ne part pas ne doit jamais
  empêcher le dépôt d'une annonce ou l'envoi d'un message. Les erreurs sont
  visibles dans les logs Vercel et via `/api/diag-email`.
- **HTML compatible email** : tableaux et styles inline, aucune feuille de
  style externe (Outlook ignore `<style>`).

## Quota

Plan Brevo gratuit : **300 emails par jour**. Au-delà, les envois sont
refusés. À surveiller si le volume d'annonces augmente.
