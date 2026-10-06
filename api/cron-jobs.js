/**
 * api/cron-jobs.js — Tâches planifiées unifiées (fusion send-alerts +
 * expire-listings pour rester sous la limite Hobby de 12 fonctions
 * serverless par déploiement).
 *
 *   GET|POST /api/cron-jobs?job=alerts   → alertes email acheteurs
 *                                           + baisses de prix (favoris)
 *                                           + traduction description_en
 *                                           (rattrapage, lot de 40/jour)
 *   GET|POST /api/cron-jobs?job=expire   → expiration annonces 90 jours
 *                                           + chaque lundi (UTC), tirage
 *                                           de la nouvelle « Annonce de la
 *                                           semaine » (vendeur PRO uniquement)
 *   GET|POST /api/cron-jobs?job=weekly-pick → déclenchement manuel du tirage
 *   GET|POST /api/cron-jobs?job=translate   → déclenchement manuel de la
 *                                              traduction (un seul lot)
 *
 * Protection : header « x-cron-secret » = CRON_SECRET, ou invocation du
 * cron Vercel (header x-vercel-cron: 1).
 *
 * Variables Vercel requises : CRON_SECRET, SUPABASE_URL,
 * SUPABASE_SERVICE_ROLE_KEY, BREVO_API_KEY (optionnel BREVO_FROM),
 * GROQ_API_KEY (traduction description_en — échec silencieux si absente).
 */
'use strict';

const BREVO = 'https://api.brevo.com/v3/smtp/email';
const SITE = 'https://aircraft2sell.eu';

module.exports.maxDuration = 60;

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function prix(montant, devise) {
  if (montant == null || montant === '') return 'Prix sur demande';
  const n = Number(montant);
  if (Number.isNaN(n)) return String(montant);
  const sym = { EUR: '€', USD: '$', GBP: '£', CHF: 'Fr' }[devise || 'EUR'] || '€';
  return n.toLocaleString('fr-FR') + ' ' + sym;
}

function prixNumerique(texte) {
  if (texte == null || texte === '') return null;
  const n = Number(String(texte).replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

function ilike(texte, motif) {
  if (!motif) return true;
  return String(texte ?? '').toLowerCase().includes(String(motif).toLowerCase());
}

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

/* ── JOB alerts : alertes email acheteurs ── */
function gabaritAlertes({ annonces }) {
  const lignes = annonces.map((l) => {
    const titre = [l.make, l.model, l.year ? `(${l.year})` : ''].filter(Boolean).join(' ') || 'Aéronef';
    const lien = `${SITE}/listing.html?id=${encodeURIComponent(l.id)}`;
    return `<tr>
      <td style="padding:14px 0;border-top:1px solid #E4EAF2">
        <div style="color:#0B2545;font-size:15px;font-weight:700">${esc(titre)}</div>
        <div style="color:#5B6B7F;font-size:13px;margin-top:3px">${esc(prix(l.price, l.currency))}</div>
        <a href="${lien}" style="color:#EA6A16;font-size:13px;font-weight:600;text-decoration:none">Voir l'annonce</a>
      </td>
    </tr>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Nouvelles annonces Aircraft2Sell</title></head>
<body style="margin:0;padding:0;background:#F4F7FB;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F7FB;padding:24px 12px">
 <tr><td align="center">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFFFF;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(11,37,69,.08)">
   <tr><td style="background:#0B2545;padding:20px 28px">
     <div style="color:#FFFFFF;font-size:19px;font-weight:800;letter-spacing:-.3px">
       Aircraft2<span style="color:#EA6A16">Sell</span></div>
   </td></tr>
   <tr><td style="padding:28px">
     <h1 style="margin:0 0 12px;color:#0B2545;font-size:20px;font-weight:800;line-height:1.3">Nouvelles annonces pour votre recherche</h1>
     <p style="margin:0 0 8px;color:#3D4F63;font-size:15px;line-height:1.6">
       ${annonces.length} annonce(s) correspondant à votre alerte viennent d'être publiées.</p>
     <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-bottom:1px solid #E4EAF2;margin:0 0 22px">${lignes}</table>
   </td></tr>
   <tr><td style="background:#F9FBFD;padding:18px 28px;border-top:1px solid #E4EAF2">
     <p style="margin:0;color:#8494A8;font-size:12px;line-height:1.6">
       Vous recevez cet email car vous avez créé une alerte sur Aircraft2Sell.<br>
       Pour ne plus recevoir ces alertes, écrivez-nous à
       <a href="mailto:contact@aircraft2sell.eu?subject=D%C3%A9sinscription%20alerte" style="color:#1E5FCC;text-decoration:none">contact@aircraft2sell.eu</a>
       ou gérez vos alertes depuis votre tableau de bord.
     </p>
   </td></tr>
  </table>
 </td></tr>
</table>
</body></html>`;
}

function correspond(alerte, l) {
  if (alerte.category && String(l.category || '').toLowerCase() !== String(alerte.category).toLowerCase()) return false;
  const maxPrix = prixNumerique(alerte.max_price);
  if (maxPrix != null) {
    const p = prixNumerique(l.price);
    if (p == null || p > maxPrix) return false;
  }
  if (alerte.min_year != null && alerte.min_year !== '') {
    const annee = Number(l.year);
    const min = Number(alerte.min_year);
    if (!Number.isInteger(annee) || !Number.isInteger(min) || annee < min) return false;
  }
  if (alerte.make && !ilike(l.make, alerte.make)) return false;
  if (alerte.country && String(l.country || '').toLowerCase() !== String(alerte.country).toLowerCase()) return false;
  if (alerte.keywords) {
    const termes = String(alerte.keywords).split(/[\s,;]+/).filter(Boolean);
    if (termes.length) {
      const texte = `${l.make || ''} ${l.model || ''} ${l.description || ''}`;
      for (const t of termes) {
        if (!ilike(texte, t)) return false;
      }
    }
  }
  return true;
}

async function jobAlerts() {
  const maintenant = new Date();
  const iso24 = new Date(maintenant.getTime() - 24 * 3600 * 1000).toISOString();

  const annonces = await sbGet(
    `listings?select=id,make,model,year,price,currency,category,country,description&status=eq.live&created_at=gte.${encodeURIComponent(iso24)}&limit=200`
  );
  const alertes = await sbGet(
    `search_alerts?select=id,email,category,max_price,min_year,make,country,keywords,last_notified_at&or=(last_notified_at.is.null,last_notified_at.lt.${encodeURIComponent(iso24)})&limit=200`
  );

  let emailsSent = 0;
  for (const alerte of alertes) {
    try {
      const correspondances = annonces.filter((l) => correspond(alerte, l));
      if (!correspondances.length) continue;
      const html = gabaritAlertes({ annonces: correspondances });
      const r = await envoyer({
        to: alerte.email,
        toName: alerte.email,
        sujet: 'Nouvelles annonces correspondant à votre recherche sur Aircraft2Sell',
        html,
      });
      if (!r.ok) {
        console.error(`Alerte ${alerte.id} (${alerte.email}) : email refusé — ${r.erreur}`);
        continue;
      }
      emailsSent += 1;
      await sbPatch(`search_alerts?id=eq.${encodeURIComponent(alerte.id)}`, { last_notified_at: maintenant.toISOString() });
    } catch (e) {
      console.error(`Alerte ${alerte.id} (${alerte.email}) : ${e.message}`);
    }
  }
  return { alerts_checked: alertes.length, emails_sent: emailsSent };
}

/* ── JOB expire : expiration des annonces 90 jours ── */
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

async function jobExpire() {
  const maintenant = new Date();
  const iso90 = new Date(maintenant.getTime() - 90 * 24 * 3600 * 1000).toISOString();
  const isoNow = maintenant.toISOString();

  const aExpirer = await sbGet(
    `listings?select=id,make,model,year,seller_email,seller_name&status=eq.live` +
    `&or=(and(expires_at.is.null,submitted_at.lt.${encodeURIComponent(iso90)}),expires_at.lt.${encodeURIComponent(isoNow)})` +
    `&order=submitted_at.asc&limit=100`
  );

  let expirees = 0;
  let emailsSent = 0;

  for (const l of aExpirer) {
    const titre = [l.make, l.model, l.year ? `(${l.year})` : ''].filter(Boolean).join(' ') || 'Votre annonce';
    try {
      await sbPatch(`listings?id=eq.${encodeURIComponent(l.id)}`, { status: 'expired' });
      expirees += 1;
    } catch (e) {
      console.error(`Expiration ${l.id} : ${e.message}`);
      continue;
    }
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

  return { expired: expirees, emails_sent: emailsSent };
}

/* ── JOB price-drop : alerte email sur baisse de prix d'un favori ── */
function gabaritBaissePrix({ annonces }) {
  const lignes = annonces.map((l) => {
    const titre = [l.make, l.model, l.year ? `(${l.year})` : ''].filter(Boolean).join(' ') || 'Aéronef';
    const lien = `${SITE}/listing.html?id=${encodeURIComponent(l.id)}`;
    const baisse = l.old_price && l.new_price ? Math.round((1 - l.new_price / l.old_price) * 100) : null;
    return `<tr>
      <td style="padding:14px 0;border-top:1px solid #E4EAF2">
        <div style="color:#0B2545;font-size:15px;font-weight:700">${esc(titre)}</div>
        <div style="color:#5B6B7F;font-size:13px;margin-top:3px">
          <span style="text-decoration:line-through;color:#9AA7B8">${esc(prix(l.old_price, l.currency))}</span>
          &nbsp;→&nbsp;
          <strong style="color:#1E8E5A">${esc(prix(l.new_price, l.currency))}</strong>
          ${baisse != null ? ` (-${baisse}%)` : ''}
        </div>
        <a href="${lien}" style="color:#EA6A16;font-size:13px;font-weight:600;text-decoration:none">Voir l'annonce</a>
      </td>
    </tr>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Baisse de prix — Aircraft2Sell</title></head>
<body style="margin:0;padding:0;background:#F4F7FB;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F7FB;padding:24px 12px">
 <tr><td align="center">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFFFF;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(11,37,69,.08)">
   <tr><td style="background:#0B2545;padding:20px 28px">
     <div style="color:#FFFFFF;font-size:19px;font-weight:800;letter-spacing:-.3px">
       Aircraft2<span style="color:#EA6A16">Sell</span></div>
   </td></tr>
   <tr><td style="padding:28px">
     <h1 style="margin:0 0 12px;color:#0B2545;font-size:20px;font-weight:800;line-height:1.3">Baisse de prix sur un de vos favoris</h1>
     <p style="margin:0 0 8px;color:#3D4F63;font-size:15px;line-height:1.6">
       Le vendeur a baissé le prix ${annonces.length > 1 ? 'de ces annonces' : 'de cette annonce'} que vous suivez.</p>
     <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-bottom:1px solid #E4EAF2;margin:0 0 22px">${lignes}</table>
   </td></tr>
   <tr><td style="background:#F9FBFD;padding:18px 28px;border-top:1px solid #E4EAF2">
     <p style="margin:0;color:#8494A8;font-size:12px;line-height:1.6">
       Vous recevez cet email car cette annonce est dans vos favoris sur Aircraft2Sell.<br>
       Retirez-la de vos favoris depuis votre tableau de bord pour ne plus être notifié.
     </p>
   </td></tr>
  </table>
 </td></tr>
</table>
</body></html>`;
}

async function jobPriceDrop() {
  const maintenant = new Date();
  const iso24 = new Date(maintenant.getTime() - 24 * 3600 * 1000).toISOString();

  /* Baisses de prix enregistrées par le trigger SQL log_price_change()
     dans les dernières 24h (uniquement les vraies baisses, pas les hausses). */
  const baisses = await sbGet(
    `price_history?select=listing_id,old_price,new_price,changed_at&changed_at=gte.${encodeURIComponent(iso24)}&new_price=not.is.null&old_price=not.is.null&limit=200`
  );
  const reellesBaisses = baisses.filter((b) => Number(b.new_price) < Number(b.old_price));
  if (!reellesBaisses.length) return { drops_found: 0, emails_sent: 0 };

  const idsAnnonces = [...new Set(reellesBaisses.map((b) => b.listing_id))];
  const annonces = await sbGet(
    `listings?select=id,make,model,year,currency,status&id=in.(${idsAnnonces.join(',')})&status=eq.live`
  );
  const annoncesParId = new Map(annonces.map((l) => [String(l.id), l]));

  let emailsSent = 0;
  for (const idAnnonce of idsAnnonces) {
    const annonce = annoncesParId.get(String(idAnnonce));
    if (!annonce) continue; // annonce retirée/vendue depuis, pas de notif
    const baisse = reellesBaisses.filter((b) => String(b.listing_id) === String(idAnnonce)).sort((a, b) => new Date(a.changed_at) - new Date(b.changed_at))[0];

    const favoris = await sbGet(`favorites?select=user_email&listing_id=eq.${encodeURIComponent(idAnnonce)}&limit=500`);
    for (const fav of favoris) {
      try {
        const html = gabaritBaissePrix({
          annonces: [{ ...annonce, old_price: baisse.old_price, new_price: baisse.new_price, currency: annonce.currency }],
        });
        const r = await envoyer({
          to: fav.user_email,
          toName: fav.user_email,
          sujet: 'Baisse de prix sur un de vos favoris — Aircraft2Sell',
          html,
        });
        if (r.ok) emailsSent += 1;
        else console.error(`Baisse prix ${idAnnonce} (${fav.user_email}) : ${r.erreur}`);
      } catch (e) {
        console.error(`Baisse prix ${idAnnonce} (${fav.user_email}) : ${e.message}`);
      }
    }
  }
  return { drops_found: idsAnnonces.length, emails_sent: emailsSent };
}

/* ── JOB weekly-pick : nouvelle « Annonce de la semaine » chaque lundi ── */
function estLundiUTC(date) {
  return date.getUTCDay() === 1; // 0=dimanche, 1=lundi
}

async function jobWeeklyPick() {
  /* Annonces actives, vendeur PRO uniquement (comme demandé), avec au
     moins une photo pour un rendu correct en vitrine. */
  const candidates = await sbGet(
    `listings?select=id,photos,weekly_pick&status=eq.live&seller_is_pro=eq.true&limit=500`
  );
  const eligibles = candidates.filter((l) => Array.isArray(l.photos) && l.photos.length > 0);
  if (!eligibles.length) {
    return { picked: null, reason: 'aucune annonce professionnelle éligible (live, avec photo)' };
  }

  /* Éviter de retomber sur l'annonce déjà mise en avant la semaine
     précédente quand il y a le choix. */
  const actuelle = eligibles.find((l) => l.weekly_pick);
  const pool = eligibles.length > 1 && actuelle
    ? eligibles.filter((l) => l.id !== actuelle.id)
    : eligibles;

  const choisie = pool[Math.floor(Math.random() * pool.length)];

  await sbPatch(`listings?weekly_pick=eq.true`, { weekly_pick: false });
  await sbPatch(`listings?id=eq.${encodeURIComponent(choisie.id)}`, { weekly_pick: true, featured: true });

  return { picked: choisie.id, pool_size: pool.length };
}

/* ── JOB translate : description_en manquante (rattrapage + nouvelles
   modifications) ── Traduit via Groq (même fournisseur que l'assistant
   conversationnel, api/chat.js — aucune nouvelle clé/coût). Greffé sur le
   cron quotidien "alerts" (08h00 UTC), même stratégie que weekly-pick sur
   "expire" : limite Hobby Vercel = 2 entrées cron max dans vercel.json.
   Ne traite PAS les annonces approuvées (celles-ci sont déjà traduites à
   l'approbation, cf. api/notify.js moderated()) — ce job est un filet de
   sécurité pour : le rattrapage ponctuel des annonces déjà live avant la
   mise en place de cette fonctionnalité, et les annonces dont la
   description a été modifiée après publication (dashboard.html vide
   description_en à l'édition pour forcer une retraduction ici). */
async function traduireEnAnglais(texte) {
  const t = String(texte || '').trim();
  if (!t) return { texte: null, erreur: 'texte source vide' };
  const cle = process.env.GROQ_API_KEY;
  if (!cle) return { texte: null, erreur: 'GROQ_API_KEY absente' };
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
    if (!r.ok) {
      const corpsErreur = await r.text();
      return { texte: null, erreur: `Groq HTTP ${r.status} : ${corpsErreur.slice(0, 200)}` };
    }
    const data = await r.json();
    let traduit = data?.choices?.[0]?.message?.content?.trim();
    if (!traduit) return { texte: null, erreur: 'réponse Groq sans contenu' };
    /* Garde-fou : voir api/_lib.js traduireEnAnglais() (fonction dupliquée
       ici car ce fichier est en CommonJS, api/_lib.js en ESM — pas d'import
       croisé simple entre les deux formats sur Vercel). */
    const estMetaCommentaire = traduit.length < t.length * 0.3 &&
      /already\s+(in\s+)?english|texte?\s+est\s+d[ée]j[aà]/i.test(traduit);
    return { texte: estMetaCommentaire ? t : traduit, erreur: null };
  } catch (e) {
    return { texte: null, erreur: `exception : ${e.message}` };
  }
}

async function jobTranslate(batchLimit) {
  /* Limite de lot par passage : le tier gratuit Groq plafonne à 1000
     tokens de SORTIE par minute (OTPM) pour ce modèle — confirmé en
     pratique (429 "Rate limit reached... OTPM: Limit 1000, Used 860" dès
     la 5e/6e requête d'un lot sans pause). Une description peut traduire
     en 600-1200 tokens de sortie à elle seule : on ne peut donc espérer
     qu'1 traduction réussie toutes ~60-90s de façon fiable, jamais un lot
     de plusieurs dizaines en une seule invocation. Le cron quotidien
     (BATCH_LIMIT par défaut) avance donc très lentement par nature — le
     rattrapage initial ponctuel doit être piloté depuis l'extérieur avec
     ?limit=1 et un délai de 90s+ entre chaque appel HTTP à cet endpoint
     (voir note de déploiement), pas en augmentant ce nombre. */
  const BATCH_LIMIT = Number(batchLimit) > 0 ? Math.min(Number(batchLimit), 40) : 40;
  const annonces = await sbGet(
    `listings?select=id,description&status=eq.live&description_en=is.null&description=not.is.null&order=submitted_at.asc&limit=${BATCH_LIMIT}`
  );

  let translated = 0;
  let failed = 0;
  const erreurs = [];
  for (const l of annonces) {
    try {
      const { texte: traduit, erreur } = await traduireEnAnglais(l.description);
      if (!traduit) {
        failed += 1;
        erreurs.push({ id: l.id, raison: erreur || 'inconnue' });
        continue;
      }
      await sbPatch(`listings?id=eq.${encodeURIComponent(l.id)}`, { description_en: traduit });
      translated += 1;
      /* Pause entre deux appels Groq : le tier gratuit plafonne à 1000
         tokens de SORTIE par minute pour ce modèle (confirmé : 429 dès la
         5e/6e requête sans pause). 15s reste optimiste mais permet de
         profiter d'une fenêtre glissante de tokens déjà partiellement
         libérée plutôt que d'attendre une minute pleine à chaque fois —
         accepte un certain taux d'échec résiduel plutôt que de monopoliser
         le maxDuration=60s de cette fonction sur une seule traduction. */
      await new Promise((r) => setTimeout(r, 15000));
    } catch (e) {
      console.error(`Traduction ${l.id} : ${e.message}`);
      failed += 1;
      erreurs.push({ id: l.id, raison: e.message });
    }
  }
  return { checked: annonces.length, translated, failed, erreurs: erreurs.slice(0, 5) };
}

/* ── Handler principal ── */
module.exports = async function handler(req, res) {
  const cronSecretOk = req.headers['x-cron-secret'] === process.env.CRON_SECRET;
  const vercelCronOk = req.headers['x-vercel-cron'] === '1';
  if (!cronSecretOk && !vercelCronOk) {
    return res.status(401).json({ error: 'Non autorisé' });
  }
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const job = (req.query && req.query.job) || '';
  try {
    if (job === 'expire') {
      const resultatsExpire = await jobExpire();
      /* Limite Hobby Vercel : 2 crons distincts max dans vercel.json, donc
         pas d'entrée cron dédiée pour l'annonce de la semaine. On la
         branche sur le cron quotidien "expire" (3h UTC) et on ne l'exécute
         que le lundi. */
      let resultatsWeeklyPick = null;
      if (estLundiUTC(new Date())) {
        try {
          resultatsWeeklyPick = await jobWeeklyPick();
        } catch (e) {
          console.error(`weekly-pick (appelé depuis expire, lundi) : ${e.message}`);
          resultatsWeeklyPick = { error: e.message };
        }
      }
      return res.status(200).json({ expire: resultatsExpire, weekly_pick: resultatsWeeklyPick });
    }
    if (job === 'price-drop') {
      return res.status(200).json(await jobPriceDrop());
    }
    if (job === 'weekly-pick') {
      /* Déclenchement manuel (admin ou test) : ignore la vérification du
         jour et retire toujours la marque weekly_pick précédente. */
      return res.status(200).json(await jobWeeklyPick());
    }
    if (job === 'translate') {
      /* Déclenchement manuel (admin ou test) : un seul lot immédiat, sans
         attendre le cron quotidien 08h00 UTC. ?limit=N (1-40, défaut 40)
         pour piloter un rattrapage initial sans se heurter au plafond
         Groq OTPM — appeler avec limit=1 en boucle externe, espacé de
         90s+, plutôt qu'un gros lot d'un coup (voir jobTranslate). */
      const limiteManuelle = req.query && req.query.limit;
      return res.status(200).json(await jobTranslate(limiteManuelle));
    }
    /* défaut : alerts. Le job quotidien 08h00 UTC (vercel.json) déclenche
       aussi price-drop ET translate dans la même invocation — on reste à 2
       entrées cron dans vercel.json (limite Hobby : 2 crons distincts max). */
    const resultatsAlerts = await jobAlerts();
    let resultatsPriceDrop = { drops_found: 0, emails_sent: 0 };
    try {
      resultatsPriceDrop = await jobPriceDrop();
    } catch (e) {
      console.error(`price-drop (appelé depuis alerts) : ${e.message}`);
    }
    let resultatsTranslate = { checked: 0, translated: 0, failed: 0 };
    try {
      resultatsTranslate = await jobTranslate();
    } catch (e) {
      console.error(`translate (appelé depuis alerts) : ${e.message}`);
    }
    return res.status(200).json({ alerts: resultatsAlerts, price_drop: resultatsPriceDrop, translate: resultatsTranslate });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
