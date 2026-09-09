/**
 * api/testimonials.js — Avis des acheteurs (témoignages) sur les vendeurs.
 *
 * GET  /api/testimonials?seller_email=...  -> témoignages PUBLIÉS (status live)
 *                                             de ce vendeur, du plus récent
 *                                             au plus ancien.
 * POST /api/testimonials                   -> dépôt d'un avis (status pending,
 *                                             passe par la modération admin).
 *
 * Corps POST accepté : { listing_id?, seller_email, author_name,
 *                        author_email?, rating, comment }
 * Validations : seller_email (email), author_name (requis), rating (entier
 *               1-5), comment (requis, ≤ 1000 caractères), author_email
 *               (email si fourni).
 *
 * Module CommonJS (convention api/ du dépôt). Secrets via process.env :
 *   SUPABASE_URL              ex. https://<ref>.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY clé service (contourne la RLS pour insérer
 *                             en pending et lire les avis).
 *
 * CORS étoile : le widget et les pages partenaires peuvent appeler cette
 * route depuis n'importe quel domaine.
 */

const SB_URL = process.env.SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'content-type, authorization, apikey');
}

function isEmail(v) {
  return typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
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

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }

  /* ── GET : témoignages publiés d'un vendeur ── */
  if (req.method === 'GET') {
    const email = (req.query && req.query.seller_email
      ? String(req.query.seller_email) : '').trim().toLowerCase();
    if (!isEmail(email)) {
      res.status(400).json({ error: 'Paramètre seller_email invalide ou manquant' });
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

  /* ── POST : dépôt d'un avis (pending, modération) ── */
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Méthode non autorisée' });
    return;
  }

  const b = (req.body && typeof req.body === 'object') ? req.body : {};
  const sellerEmail = (b.seller_email || '').trim().toLowerCase();
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
};
