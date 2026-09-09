/**
 * api/send-alerts.js — Alertes email acheteurs (suggestion A2)
 *
 * Appelée par un cron (Vercel Cron ou externe) plusieurs fois par jour.
 * Pour chaque alerte de search_alerts « due » (jamais notifiée, ou pas
 * depuis la veille), cherche les annonces live créées dans les 24 h qui
 * correspondent aux critères de l'alerte, et envoie UN email Brevo par
 * alerte si au moins une annonce correspond.
 *
 * Méthodes : GET et POST. Protection : header « x-cron-secret » doit
 * valoir process.env.CRON_SECRET, sinon 401.
 *
 * Variables d'environnement Vercel requises :
 *   CRON_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, BREVO_API_KEY
 *   (optionnel : BREVO_FROM, défaut contact@aircraft2sell.eu)
 *
 * Réponse : { alerts_checked, emails_sent } — les erreurs par alerte
 * sont attrapées et n'interrompent pas le run.
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

/** Prix formaté fr-FR avec symbole devise (même logique que _lib.js). */
function prix(montant, devise) {
  if (montant == null || montant === '') return 'Prix sur demande';
  const n = Number(montant);
  if (Number.isNaN(n)) return String(montant);
  const sym = { EUR: '€', USD: '$', GBP: '£', CHF: 'Fr' }[devise || 'EUR'] || '€';
  return n.toLocaleString('fr-FR') + ' ' + sym;
}

/** Prix comparable : extrait un nombre du texte brut, null si inutilisable. */
function prixNumerique(texte) {
  if (texte == null || texte === '') return null;
  const n = Number(String(texte).replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

/** Comparaison « ilike » : sous-chaîne insensible à la casse. */
function ilike(texte, motif) {
  if (!motif) return true;
  return String(texte ?? '').toLowerCase().includes(String(motif).toLowerCase());
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

/** Écriture Supabase (PATCH) avec la clé de service. */
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

/** Gabarit HTML sobre navy/orange pour la liste d'annonces. */
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

/**
 * Une annonce correspond-elle aux critères de l'alerte ?
 * Tous les critères renseignés doivent être satisfaits.
 */
function correspond(alerte, l) {
  // Catégorie : égale si renseignée.
  if (alerte.category && String(l.category || '').toLowerCase() !== String(alerte.category).toLowerCase()) return false;

  // Prix max : prix de l'annonce <= max_price (comparaison numérique).
  const maxPrix = prixNumerique(alerte.max_price);
  if (maxPrix != null) {
    const p = prixNumerique(l.price);
    if (p == null || p > maxPrix) return false;
  }

  // Année minimum : année de l'annonce >= min_year.
  if (alerte.min_year != null && alerte.min_year !== '') {
    const annee = Number(l.year);
    const min = Number(alerte.min_year);
    if (!Number.isInteger(annee) || !Number.isInteger(min) || annee < min) return false;
  }

  // Marque : ilike si renseignée.
  if (alerte.make && !ilike(l.make, alerte.make)) return false;

  // Pays : égal si renseigné.
  if (alerte.country && String(l.country || '').toLowerCase() !== String(alerte.country).toLowerCase()) return false;

  // Mots-clés : chaque terme doit apparaître dans make + model + description.
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
    const iso24 = new Date(maintenant.getTime() - 24 * 3600 * 1000).toISOString();

    // Annonces live créées dans les dernières 24 h.
    const annonces = await sbGet(
      `listings?select=id,make,model,year,price,currency,category,country,description&status=eq.live&created_at=gte.${encodeURIComponent(iso24)}&limit=200`
    );

    // Alertes dues : jamais notifiées, ou pas depuis la veille.
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
          continue; // pas de PATCH : la prochaine passe réessaiera
        }
        emailsSent += 1;

        // Marquée notifiée pour ne pas renvoyer avant la veille.
        await sbPatch(`search_alerts?id=eq.${encodeURIComponent(alerte.id)}`, { last_notified_at: maintenant.toISOString() });
      } catch (e) {
        console.error(`Alerte ${alerte.id} (${alerte.email}) : ${e.message}`);
      }
    }

    return res.status(200).json({ alerts_checked: alertes.length, emails_sent: emailsSent });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
