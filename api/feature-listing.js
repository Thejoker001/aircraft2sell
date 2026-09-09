/**
 * api/feature-listing.js — Mise en avant payante d'une annonce.
 *
 * Placeholder : le webhook Stripe (api/stripe-webhook.js) appellera cette
 * fonction après confirmation du paiement de la mise en avant. Elle peut aussi
 * être appelée par tout service interne disposant du secret.
 *
 *   POST /api/feature-listing
 *   Header : x-feature-secret: <FEATURE_SECRET>
 *   Body   : { listing_id }
 *   -> 200 { ok: true, featured: true, featured_until: "…" }
 *   -> 401 { error: 'Non autorisé' }            si secret absent/incorrect
 *   -> 404 { error: 'Annonce introuvable' }     si l'annonce n'existe pas
 *
 * Effet : PATCH listings SET featured = true, featured_until = now() + 30 jours.
 *
 * Variables Vercel requises : SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 * FEATURE_SECRET.
 */
function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://aircraft2sell.eu');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'content-type, authorization, apikey, x-feature-secret');
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Méthode non autorisée' });
    return;
  }

  /* Protection : le secret partagé est obligatoire (header x-feature-secret). */
  const secret = process.env.FEATURE_SECRET;
  const recu = req.headers['x-feature-secret'];
  if (!secret || !recu || recu !== secret) {
    res.status(401).json({ error: 'Non autorisé' });
    return;
  }

  const url = process.env.SUPABASE_URL;
  const cle = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !cle) {
    res.status(503).json({ error: 'Configuration Supabase absente' });
    return;
  }

  const corps = req.body || {};
  const listingId = corps.listing_id || corps.listingId || corps.id;
  if (!listingId) {
    res.status(400).json({ error: 'listing_id requis' });
    return;
  }

  try {
    /* 1. L'annonce doit exister (clé de service : contourne la RLS). */
    const rows = await fetch(`${url}/rest/v1/listings?id=eq.${encodeURIComponent(listingId)}&select=id&limit=1`, {
      headers: { apikey: cle, Authorization: `Bearer ${cle}` },
    }).then(async (r) => {
      if (!r.ok) throw new Error(`Supabase ${r.status}`);
      return r.json();
    });
    if (!Array.isArray(rows) || !rows.length) {
      res.status(404).json({ error: 'Annonce introuvable' });
      return;
    }

    /* 2. Mise en avant : 30 jours à partir de maintenant. */
    const featuredUntil = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();
    const r = await fetch(`${url}/rest/v1/listings?id=eq.${encodeURIComponent(listingId)}`, {
      method: 'PATCH',
      headers: {
        apikey: cle,
        Authorization: `Bearer ${cle}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ featured: true, featured_until: featuredUntil }),
    });
    if (!r.ok) throw new Error(`Supabase ${r.status}`);

    res.status(200).json({ ok: true, featured: true, featured_until: featuredUntil });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
