/**
 * api/_lib.js — Socle commun aux notifications par email.
 *
 * Les fonctions Edge Supabase appelées par le site (notify-new-listing,
 * notify-listing-approved, send-listing-message) répondent toutes 404 :
 * elles n'ont jamais été déployées, donc AUCUN email n'était envoyé.
 * On les remplace par des fonctions serverless Vercel, déployées avec le
 * site à chaque push.
 *
 * La clé Brevo reste côté serveur : elle n'apparaît jamais dans le navigateur.
 *
 * Variables d'environnement Vercel requises :
 *   BREVO_API_KEY              clé API Brevo
 *   SUPABASE_URL               https://<ref>.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY  clé service (lecture des annonces/membres)
 *   ADMIN_EMAIL                destinataire des alertes (défaut ci-dessous)
 */

const BREVO = 'https://api.brevo.com/v3/smtp/email';

export const EXPEDITEUR = {
  name: 'Aircraft2Sell',
  email: process.env.BREVO_FROM || 'contact@aircraft2sell.eu',
};

export const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'contact@aircraft2sell.eu';
export const SITE = 'https://aircraft2sell.eu';

/** Échappement HTML : le contenu vient d'utilisateurs, jamais de confiance. */
export function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export function prix(montant, devise) {
  if (montant == null || montant === '') return 'Prix sur demande';
  const n = Number(montant);
  if (Number.isNaN(n)) return String(montant);
  const sym = { EUR: '€', USD: '$', GBP: '£', CHF: 'Fr' }[devise || 'EUR'] || '€';
  return n.toLocaleString('fr-FR') + ' ' + sym;
}

export function titreAeronef(l) {
  return [l.make, l.model, l.year ? `(${l.year})` : ''].filter(Boolean).join(' ') || 'Aéronef';
}

/** Lecture Supabase avec la clé de service (contourne la RLS). */
export async function sb(chemin) {
  const url = process.env.SUPABASE_URL;
  const cle = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !cle) throw new Error('Configuration Supabase absente');
  const r = await fetch(`${url}/rest/v1/${chemin}`, {
    headers: { apikey: cle, Authorization: `Bearer ${cle}` },
  });
  if (!r.ok) throw new Error(`Supabase ${r.status} : ${(await r.text()).slice(0, 200)}`);
  return r.json();
}

/** Gabarit commun : en-tête, contenu, pied de page. */
export function gabarit({ titre, intro, blocs = [], cta, ctaLabel, pied }) {
  const lignes = blocs.map(([k, v]) =>
    `<tr>
       <td style="padding:8px 0;color:#5B6B7F;font-size:14px;width:150px">${esc(k)}</td>
       <td style="padding:8px 0;color:#0B2545;font-size:14px;font-weight:600">${v}</td>
     </tr>`).join('');

  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(titre)}</title></head>
<body style="margin:0;padding:0;background:#F4F7FB;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F7FB;padding:24px 12px">
 <tr><td align="center">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFFFF;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(11,37,69,.08)">

   <tr><td style="background:#0B2545;padding:20px 28px">
     <div style="color:#FFFFFF;font-size:19px;font-weight:800;letter-spacing:-.3px">
       Aircraft2<span style="color:#EA6A16">Sell</span></div>
   </td></tr>

   <tr><td style="padding:28px">
     <h1 style="margin:0 0 12px;color:#0B2545;font-size:20px;font-weight:800;line-height:1.3">${esc(titre)}</h1>
     <p style="margin:0 0 20px;color:#3D4F63;font-size:15px;line-height:1.6">${intro}</p>
     ${lignes ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"
        style="border-top:1px solid #E4EAF2;border-bottom:1px solid #E4EAF2;margin:0 0 22px">${lignes}</table>` : ''}
     ${cta ? `<table role="presentation" cellpadding="0" cellspacing="0"><tr>
        <td style="background:#EA6A16;border-radius:8px">
          <a href="${cta}" style="display:inline-block;padding:12px 24px;color:#FFFFFF;
             font-size:15px;font-weight:700;text-decoration:none">${esc(ctaLabel || 'Voir')}</a>
        </td></tr></table>` : ''}
     ${pied ? `<p style="margin:22px 0 0;color:#5B6B7F;font-size:13px;line-height:1.6">${pied}</p>` : ''}
   </td></tr>

   <tr><td style="background:#F9FBFD;padding:18px 28px;border-top:1px solid #E4EAF2">
     <p style="margin:0;color:#8494A8;font-size:12px;line-height:1.6">
       Aircraft2Sell — marketplace aéronautique européenne, zéro commission.<br>
       <a href="${SITE}" style="color:#1E5FCC;text-decoration:none">aircraft2sell.eu</a>
       &nbsp;·&nbsp;
       <a href="${SITE}/contact.html" style="color:#1E5FCC;text-decoration:none">Nous contacter</a>
     </p>
   </td></tr>

  </table>
 </td></tr>
</table>
</body></html>`;
}

/** Envoi via Brevo. Renvoie {ok, id?, erreur?} sans jamais lever d'exception. */
export async function envoyer({ to, toName, sujet, html, replyTo }) {
  const cle = process.env.BREVO_API_KEY;
  if (!cle) return { ok: false, erreur: 'BREVO_API_KEY absente' };
  if (!to) return { ok: false, erreur: 'destinataire absent' };

  const corps = {
    sender: EXPEDITEUR,
    to: [{ email: to, name: toName || to }],
    subject: sujet,
    htmlContent: html,
  };
  if (replyTo) corps.replyTo = replyTo;

  try {
    const r = await fetch(BREVO, {
      method: 'POST',
      headers: { 'api-key': cle, 'Content-Type': 'application/json', accept: 'application/json' },
      body: JSON.stringify(corps),
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

/** En-têtes CORS : le site appelle ces fonctions depuis le navigateur. */
export function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', SITE);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'content-type, authorization, apikey');
}

/** Préambule commun : CORS, OPTIONS, méthode. Renvoie true si la requête doit s'arrêter. */
export function preambule(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') { res.status(204).end(); return true; }
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Méthode non autorisée' });
    return true;
  }
  return false;
}
