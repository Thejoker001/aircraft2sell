/**
 * api/expire-listings.js — Expiration des annonces après 90 jours (suggestion B3)
 *
 * Appelée par un cron (quotidien recommandé). Passe en status='expired'
 * les annonces live dont la durée de vie est écoulée :
 *   - expires_at est passé, OU
 *   - expires_at est null et submitted_at date de plus de 90 jours.
 * Maximum 100 annonces par run. Un email Brevo est envoyé au vendeur de
 * chaque annonce expirée, avec le lien de renouvellement.
 *
 * Méthodes : GET et POST. Protection : header « x-cron-secret » doit
 * valoir process.env.CRON_SECRET, sinon 401.
 *
 * Variables d'environnement Vercel requises :
 *   CRON_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, BREVO_API_KEY
 *   (optionnel : BREVO_FROM, défaut contact@aircraft2sell.eu)
 *
 * Réponse : { expired, emails_sent }.
 */
'use strict';

const BREVO = 'https://api.brevo.com/v3/smtp/email';
const SITE = 'https://aircraft2sell.eu';

module.exports.maxDuration = 60;

/** Échappement HTML : le contenu vient d'utilisateurs, jamais de confiance. */
function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/** Lecture Supabase avec la clé de service (contourne la RLS). */
async function sbGet(chemin) {
  const url = process.env.SUPABASE_URL;
  const cle = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !cle) throw new Error('Configuration Supabase absente');
  const r = await fetch(`${url}/rest/v1/${chemin}`, {
    headers: { apikey: cle, Authorization: `Bearer ${cle}` },
  });
  if (!r.ok) throw new Error(`Supabase ${r.status} : ${(await r.text()).slice(0, 200)}`);
  return r.json();
}

/** PATCH Supabase avec la clé de service. */
async function sbPatch(chemin, corps) {
  const url = process.env.SUPABASE_URL;
  const cle = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !cle) throw new Error('Configuration Supabase absente');
  const r = await fetch(`${url}/rest/v1/${chemin}`, {
    method: 'PATCH',
    headers: {
      apikey: cle,
      Authorization: `Bearer ${cle}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(corps),
  });
  if (!r.ok) throw new Error(`Supabase ${r.status} : ${(await r.text()).slice(0, 200)}`);
  return r;
}

/** Envoi via Brevo. Renvoie {ok, id?, erreur?} sans jamais lever d'exception. */
async function envoyer({ to, toName, sujet, html }) {
  const cle = process.env.BREVO_API_KEY;
  if (!cle) return { ok: false, erreur: 'BREVO_API_KEY absente' };
  if (!to) return { ok: false, erreur: 'destinataire absent' };
  try {
    const r = await fetch(BREVO, {
      method: 'POST',
      headers: { 'api-key': cle, 'Content-Type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({
        sender: { name: 'Aircraft2Sell', email: process.env.BREVO_FROM || 'contact@aircraft2sell.eu' },
        to: [{ email: to, name: toName || to }],
        subject: sujet,
        htmlContent: html,
      }),
    });
    const txt = await r.text();
    if (!r.ok) return { ok: false, erreur: `Brevo ${r.status} : ${txt.slice(0, 200)}` };
    let id = null;
    try { id = JSON.parse(txt).messageId; } catch { /* réponse vide acceptée */ }
    return { ok: true, id };
  } catch (e) {
    return { ok: false, erreur: e.message };
  }
}

/** Gabarit HTML sobre navy/orange pour l'expiration. */
function gabaritExpiration({ titre }) {
  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Annonce expirée — Aircraft2Sell</title></head>
<body style="margin:0;padding:0;background:#F4F7FB;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F7FB;padding:24px 12px">
 <tr><td align="center">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFFFF;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(11,37,69,.08)">
   <tr><td style="background:#0B2545;padding:20px 28px">
     <div style="color:#FFFFFF;font-size:19px;font-weight:800;letter-spacing:-.3px">
       Aircraft2<span style="color:#EA6A16">Sell</span></div>
   </td></tr>
   <tr><td style="padding:28px">
     <h1 style="margin:0 0 12px;color:#0B2545;font-size:20px;font-weight:800;line-height:1.3">Votre annonce a expiré</h1>
     <p style="margin:0 0 8px;color:#3D4F63;font-size:15px;line-height:1.6">
       ${esc(titre)} n'est plus visible sur Aircraft2Sell : sa période de publication de 90 jours est terminée.</p>
     <p style="margin:0 0 22px;color:#3D4F63;font-size:15px;line-height:1.6">
       Connectez-vous à votre espace pour renouveler votre annonce et la republier en quelques clics.</p>
     <table role="presentation" cellpadding="0" cellspacing="0"><tr>
       <td style="background:#EA6A16;border-radius:8px">
         <a href="${SITE}/login.html" style="display:inline-block;padding:12px 24px;color:#FFFFFF;
            font-size:15px;font-weight:700;text-decoration:none">Renouveler mon annonce</a>
       </td></tr></table>
     <p style="margin:22px 0 0;color:#5B6B7F;font-size:13px;line-height:1.6">
       Une question ? Écrivez-nous à
       <a href="mailto:contact@aircraft2sell.eu" style="color:#1E5FCC;text-decoration:none">contact@aircraft2sell.eu</a>.</p>
   </td></tr>
   <tr><td style="background:#F9FBFD;padding:18px 28px;border-top:1px solid #E4EAF2">
     <p style="margin:0;color:#8494A8;font-size:12px;line-height:1.6">
       Aircraft2Sell — marketplace aéronautique européenne, zéro commission.<br>
       <a href="${SITE}" style="color:#1E5FCC;text-decoration:none">aircraft2sell.eu</a>
     </p>
   </td></tr>
  </table>
 </td></tr>
</table>
</body></html>`;
}

module.exports = async function handler(req, res) {
  /* Protection : soit le header x-cron-secret vaut CRON_SECRET (appel externe
     sécurisé), soit l'invocation vient du cron Vercel (header x-vercel-cron). */
  const cronSecretOk = req.headers['x-cron-secret'] === process.env.CRON_SECRET;
  const vercelCronOk = req.headers['x-vercel-cron'] === '1';
  if (!cronSecretOk && !vercelCronOk) {
    return res.status(401).json({ error: 'Non autorisé' });
  }
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    const maintenant = new Date();
    const iso90 = new Date(maintenant.getTime() - 90 * 24 * 3600 * 1000).toISOString();
    const isoNow = maintenant.toISOString();

    // Annonces à expirer : live, et (expires_at passé OU expires_at null avec
    // submitted_at vieux de plus de 90 jours). Plafonnées à 100 par run.
    const aExpirer = await sbGet(
      `listings?select=id,make,model,year,seller_email,seller_name&status=eq.live` +
      `&or=(and(expires_at.is.null,submitted_at.lt.${encodeURIComponent(iso90)}),expires_at.lt.${encodeURIComponent(isoNow)})` +
      `&order=submitted_at.asc&limit=100`
    );

    let expirees = 0;
    let emailsSent = 0;

    for (const l of aExpirer) {
      const titre = [l.make, l.model, l.year ? `(${l.year})` : ''].filter(Boolean).join(' ') || 'Votre annonce';

      // 1. Passage en expired (filtre id : ne touche QUE cette annonce).
      try {
        await sbPatch(`listings?id=eq.${encodeURIComponent(l.id)}`, { status: 'expired' });
        expirees += 1;
      } catch (e) {
        console.error(`Expiration ${l.id} : ${e.message}`);
        continue; // pas d'email pour une annonce non expirée
      }

      // 2. Email au vendeur (erreur attrapée : l'annonce est déjà expirée,
      //    on compte simplement l'échec sans interrompre le run).
      try {
        const r = await envoyer({
          to: l.seller_email,
          toName: l.seller_name,
          sujet: 'Votre annonce a expiré sur Aircraft2Sell',
          html: gabaritExpiration({ titre }),
        });
        if (r.ok) emailsSent += 1;
        else console.error(`Email expiration ${l.id} (${l.seller_email}) : ${r.erreur}`);
      } catch (e) {
        console.error(`Email expiration ${l.id} (${l.seller_email}) : ${e.message}`);
      }
    }

    return res.status(200).json({ expired: expirees, emails_sent: emailsSent });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
