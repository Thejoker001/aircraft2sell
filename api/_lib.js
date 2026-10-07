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

/** Écriture Supabase avec la clé de service (contourne la RLS). */
export async function sbEcrire(chemin, corps) {
  const url = process.env.SUPABASE_URL;
  const cle = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !cle) throw new Error('Configuration Supabase absente');
  const r = await fetch(`${url}/rest/v1/${chemin}`, {
    method: 'POST',
    headers: {
      apikey: cle,
      Authorization: `Bearer ${cle}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(corps),
  });
  if (!r.ok) throw new Error(`Supabase ${r.status} : ${(await r.text()).slice(0, 200)}`);
}

/** Mise à jour Supabase avec la clé de service (contourne la RLS). */
export async function sbPatch(chemin, corps) {
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
}

/**
 * Traduit un texte libre français vers l'anglais via Groq (même fournisseur
 * que l'assistant conversationnel, api/chat.js — aucune nouvelle clé/coût).
 * Renvoie null en cas d'échec (quota Groq dépassé, texte vide, etc.) plutôt
 * que de lever une exception : la traduction de description est un
 * agrément, jamais bloquant pour la publication de l'annonce elle-même.
 */
export async function traduireEnAnglais(texte) {
  const t = String(texte || '').trim();
  if (!t) return null;
  const cle = process.env.GROQ_API_KEY;
  if (!cle) return null;
  try {
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${cle}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen/qwen3.8-27b',
        messages: [
          {
            role: 'system',
            content: 'You translate French aircraft-listing descriptions into English for a ' +
              'European aviation marketplace. Keep technical terms, model names, units, numbers ' +
              'and line breaks EXACTLY as in the source. Reply with NOTHING but the raw ' +
              'translated text itself : no preamble, no quotes, no markdown, no explanation, no ' +
              'comment about the source language. If the input is already fully in English, ' +
              'your reply MUST be that exact same input text, copied verbatim — never a sentence ' +
              'describing that fact.',
          },
          { role: 'user', content: t.slice(0, 4000) },
        ],
        max_tokens: 1200,
        temperature: 0.2,
      }),
    });
    if (!r.ok) return null;
    const data = await r.json();
    let traduit = data?.choices?.[0]?.message?.content?.trim();
    if (!traduit) return null;
    /* Garde-fou : le modèle répond parfois par un commentaire sur la langue
       source au lieu du texte traduit ("The text is already in English.",
       "This is already in English.") quand l'entrée est déjà en anglais —
       constaté en pratique sur un rattrapage de 40 descriptions. Un texte
       de sortie anormalement court (< 30% de la longueur source) ET qui
       mentionne "already"/"english" est presque certainement ce
       méta-commentaire, jamais une vraie traduction : on retombe alors sur
       le texte original plutôt que de publier cette phrase à la place de
       la description. */
    const estMetaCommentaire = traduit.length < t.length * 0.3 &&
      /already\s+(in\s+)?english|texte?\s+est\s+d[ée]j[aà]/i.test(traduit);
    if (estMetaCommentaire) return t;
    return traduit;
  } catch {
    return null;
  }
}


/** Gabarit commun : en-tête, contenu, pied de page. */
export function gabarit({ titre, intro, blocs = [], cta, ctaLabel, pied }) {
  const lignes = blocs.map(([k, v]) =>
    `<tr>
       <td style="padding:8px 0;color:#5B6B7F;font-size:14px;width:150px">${esc(k)}</td>
       <td style="padding:8px 0;color:#0B2545;font-size:14px;font-weight:600">${v}</td>
     </tr>`).join('');

  return `<!DOCTYPE html>
<html lang="fr" xmlns="http://www.w3.org/1999/xhtml"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>${esc(titre)}</title>
<style>
  body, table, td { -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
  table, td { mso-table-lspace:0pt; mso-table-rspace:0pt; }
  img { -ms-interpolation-mode:bicubic; border:0; outline:none; text-decoration:none; }
  body { margin:0; padding:0; width:100% !important; background:#EEF2F8; }
  .email-container { width:100% !important; max-width:600px !important; }
  @media only screen and (max-width:600px) {
    .fluid-pad { padding-left:24px !important; padding-right:24px !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:#EEF2F8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">

<center style="width:100%;background:#EEF2F8;">

  <!--[if mso]>
  <table role="presentation" width="600" align="center" cellpadding="0" cellspacing="0" border="0"><tr><td>
  <![endif]-->

  <div style="max-width:600px;margin:0 auto;text-align:left" class="email-container">

   <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
          style="width:100%;background:#FFFFFF;border-radius:16px;border-collapse:separate;overflow:hidden">

    <tr><td align="left" class="fluid-pad" style="background:#FFFFFF;padding:24px 40px;border-bottom:1px solid #E4EAF2">
      <img src="${SITE}/logo.png?v=20260908" alt="Aircraft2Sell" width="160" height="26"
           style="display:block;width:160px;height:auto;border:0;outline:none;text-decoration:none">
    </td></tr>

    <tr><td align="left" class="fluid-pad" style="padding:40px 44px 8px">
     <h1 style="margin:0 0 20px;color:#0B2545;font-size:24px;font-weight:800;line-height:1.3">${esc(titre)}</h1>
     <p style="margin:0 0 20px;color:#3D4F63;font-size:15px;line-height:1.6">${intro}</p>
     ${lignes ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"
        style="border-top:1px solid #E4EAF2;border-bottom:1px solid #E4EAF2;margin:0 0 22px">${lignes}</table>` : ''}
     ${cta ? `<table role="presentation" cellpadding="0" cellspacing="0"><tr>
        <td style="background:#EA6A16;border-radius:8px">
          <a href="${cta}" style="display:inline-block;padding:13px 26px;color:#FFFFFF;
             font-size:15px;font-weight:700;text-decoration:none;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">${esc(ctaLabel || 'Voir')}</a>
        </td></tr></table>` : ''}
     ${pied ? `<p style="margin:18px 0 0;color:#8494A8;font-size:12px;line-height:1.6">${pied}</p>` : ''}
    </td></tr>

    <tr><td class="fluid-pad" style="padding:28px 44px 0">
      <hr style="border:none;border-top:1px solid #E4EAF2;margin:0">
    </td></tr>

    <tr><td align="left" class="fluid-pad" style="padding:24px 44px 32px">
      <p style="margin:0;color:#8494A8;font-size:12px;line-height:1.7">
        Aircraft2Sell — marketplace aéronautique européenne, zéro commission.<br>
        <a href="${SITE}" style="color:#1E5FCC;text-decoration:none">aircraft2sell.eu</a>
        &nbsp;·&nbsp;
        <a href="${SITE}/contact.html" style="color:#1E5FCC;text-decoration:none">Nous contacter</a>
      </p>
    </td></tr>

   </table>
  </div>

  <!--[if mso]>
  </td></tr></table>
  <![endif]-->

</center>

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
    if (!r.ok) {
      /* Brevo refuse les IP inconnues quand la restriction « Authorised IPs »
         est active sur le compte. Les fonctions serverless Vercel n'ont pas
         d'IP fixe : il faut désactiver cette restriction dans le tableau de
         bord Brevo (Paramètres → Sécurité → Adresses IP autorisées).
         On rend le diagnostic explicite plutôt que de renvoyer un 502 muet. */
      if (r.status === 401 && /unrecognised IP address/i.test(txt)) {
        const ip = (txt.match(/IP address ([\d.]+)/) || [])[1] || 'inconnue';
        return {
          ok: false,
          erreur: `Brevo bloque l'IP ${ip} (restriction « Authorised IPs » active). ` +
                  `Désactiver la restriction dans Brevo → Paramètres → Sécurité, ` +
                  `ou y ajouter les plages Vercel.`,
          codeConnu: 'BREVO_IP_BLOQUEE',
        };
      }
      return { ok: false, erreur: `Brevo ${r.status} : ${txt.slice(0, 200)}` };
    }
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
