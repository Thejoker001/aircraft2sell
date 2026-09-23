/**
 * api/forms.js — Formulaires publics simples (fusion report-listing +
 * testimonials pour rester sous la limite Hobby de 12 fonctions serverless
 * par déploiement — même stratégie que api/notify.js et api/cron-jobs.js).
 *
 * Routage par ?kind= (GET) ou body.kind (POST) :
 *   kind=report      -> POST  signalement d'annonce (ex api/report-listing.js)
 *   kind=testimonial -> GET/POST témoignages vendeur (ex api/testimonials.js)
 *
 * Comportement IDENTIQUE aux deux anciennes fonctions (mêmes validations,
 * mêmes réponses, mêmes codes HTTP) — seul le point d'entrée change.
 *
 * Variables d'environnement Vercel requises :
 *   SUPABASE_URL               https://<ref>.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY  clé service
 */

const SB_URL = process.env.SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'content-type, authorization, apikey');
}

function isEmail(v) {
  return typeof v === 'string' && EMAIL_RE.test(v.trim());
}

/** Appel Supabase REST avec la clé de service. */
function supabase(chemin, options) {
  if (!SB_URL || !SB_KEY) throw new Error('Configuration Supabase absente');
  options = options || {};
  const headers = Object.assign({
    apikey: SB_KEY,
    Authorization: 'Bearer ' + SB_KEY,
  }, options.headers || {});
  return fetch(SB_URL + '/rest/v1/' + chemin, Object.assign({}, options, { headers }));
}

/* ── kind=report : signalement d'annonce (POST uniquement) ── */
async function handleReport(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }
  try {
    const corps = req.body || {};
    const listing_id = corps.listing_id != null && corps.listing_id !== '' ? String(corps.listing_id) : null;
    const reporter_email = String(corps.reporter_email || '').trim().toLowerCase();
    const reason = String(corps.reason || '').trim();
    const details = corps.details != null ? String(corps.details).trim() : '';

    if (!listing_id) {
      return res.status(400).json({ error: 'listing_id manquant' });
    }
    if (reason.length < 3 || reason.length > 200) {
      return res.status(400).json({ error: 'La raison doit contenir entre 3 et 200 caractères' });
    }
    if (!EMAIL_RE.test(reporter_email)) {
      return res.status(400).json({ error: 'Email du déclarant invalide' });
    }
    if (!SB_URL || !SB_KEY) {
      return res.status(500).json({ error: 'Configuration Supabase absente' });
    }

    const r = await supabase('reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Prefer: 'return=representation' },
      body: JSON.stringify({
        listing_id,
        reporter_email,
        reason,
        details: details || null,
        status: 'pending',
      }),
    });
    if (!r.ok) {
      throw new Error(`Supabase ${r.status} : ${(await r.text()).slice(0, 200)}`);
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

/* ── kind=testimonial : GET (liste publiée) / POST (dépôt) ── */
async function handleTestimonial(req, res) {
  if (req.method === 'GET') {
    let email = (req.query && req.query.seller_email
      ? String(req.query.seller_email) : '').trim().toLowerCase();
    const pseudo = (req.query && req.query.seller_pseudo
      ? String(req.query.seller_pseudo) : '').trim();
    if (!email && pseudo) {
      try {
        const ru = await supabase('users?select=email&pseudo=eq.' + encodeURIComponent(pseudo) + '&limit=1');
        if (ru.ok) {
          const urows = await ru.json();
          if (urows && urows[0]) email = String(urows[0].email || '').toLowerCase();
        }
      } catch (e) { /* email reste vide, gérée par le contrôle isEmail ci-dessous */ }
    }
    if (!isEmail(email)) {
      res.status(400).json({ error: 'Paramètre seller_email ou seller_pseudo invalide ou manquant' });
      return;
    }
    try {
      const r = await supabase(
        'testimonials?status=eq.live&seller_email=eq.' + encodeURIComponent(email) +
        '&order=created_at.desc&select=id,listing_id,author_name,rating,comment,created_at'
      );
      if (!r.ok) {
        res.status(502).json({ error: 'Supabase ' + r.status + ' : ' + (await r.text()).slice(0, 200) });
        return;
      }
      const rows = await r.json();
      res.status(200).json(Array.isArray(rows) ? rows : []);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Méthode non autorisée' });
    return;
  }

  const b = (req.body && typeof req.body === 'object') ? req.body : {};
  let sellerEmail = (b.seller_email || '').trim().toLowerCase();
  const sellerPseudo = (b.seller_pseudo || '').trim();
  if (!sellerEmail && sellerPseudo) {
    try {
      const ru = await supabase('users?select=email&pseudo=eq.' + encodeURIComponent(sellerPseudo) + '&limit=1');
      if (ru.ok) {
        const urows = await ru.json();
        if (urows && urows[0]) sellerEmail = String(urows[0].email || '').toLowerCase();
      }
    } catch (e) { /* sellerEmail reste vide, géré par isEmail ci-dessous */ }
  }
  const authorName = (b.author_name || '').trim();
  const authorEmail = (b.author_email || '').trim().toLowerCase();
  const comment = (b.comment || '').trim();
  const rating = parseInt(b.rating, 10);
  const listingId = (b.listing_id != null && b.listing_id !== '') ? b.listing_id : null;

  if (!isEmail(sellerEmail)) {
    return res.status(400).json({ error: 'seller_email invalide' });
  }
  if (!authorName) {
    return res.status(400).json({ error: 'author_name requis' });
  }
  if (authorName.length > 80) {
    return res.status(400).json({ error: 'author_name trop long (80 caractères max)' });
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'rating doit être un entier de 1 à 5' });
  }
  if (!comment) {
    return res.status(400).json({ error: 'comment requis' });
  }
  if (comment.length > 1000) {
    return res.status(400).json({ error: 'comment trop long (1000 caractères max)' });
  }
  if (authorEmail && !isEmail(authorEmail)) {
    return res.status(400).json({ error: 'author_email invalide' });
  }

  try {
    const r = await supabase('testimonials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Prefer: 'return=representation' },
      body: JSON.stringify({
        listing_id: listingId,
        seller_email: sellerEmail,
        author_name: authorName,
        author_email: authorEmail || null,
        rating: rating,
        comment: comment,
        status: 'pending',
      }),
    });
    const txt = await r.text();
    if (!r.ok) {
      res.status(502).json({ error: 'Supabase ' + r.status + ' : ' + txt.slice(0, 200) });
      return;
    }
    let rows = [];
    try { rows = JSON.parse(txt || '[]'); } catch (e) { rows = []; }
    const row = Array.isArray(rows) ? rows[0] : rows;
    res.status(201).json({ ok: true, id: row && row.id != null ? row.id : null });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }

  const kind = (req.query && req.query.kind) || (req.body && req.body.kind) || '';

  if (kind === 'report') return handleReport(req, res);
  if (kind === 'testimonial') return handleTestimonial(req, res);

  return res.status(400).json({ error: 'kind manquant ou invalide (report | testimonial)' });
};
