/**
 * api/report-listing.js
 * Reçoit un signalement d'annonce depuis le site public et l'insère dans
 * public.reports via Supabase REST (clé de service, jamais exposée au
 * navigateur). Le panneau admin (admin-a2s00760.html, onglet « Signalements »)
 * lit et traite ces signalements avec le JWT de l'admin.
 *
 * Corps accepté : { listing_id, reporter_email, reason, details? }
 * Variables d'environnement Vercel requises :
 *   SUPABASE_URL               https://<ref>.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY  clé service
 */
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'content-type, authorization, apikey');
}

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
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
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return res.status(500).json({ error: 'Configuration Supabase absente' });
    }

    const r = await fetch(`${SUPABASE_URL}/rest/v1/reports`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
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
};
