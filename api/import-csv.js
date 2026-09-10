/**
 * api/import-csv.js — Import d'annonces en masse (CSV) depuis le dashboard vendeur.
 *
 * Le CSV est parsé côté navigateur (dashboard.html) : split sur point-virgule
 * et sur les lignes, en-tête ignorée, validation make/model/price/category.
 * Cette fonction reçoit déjà la structure nettoyée :
 *
 *   POST /api/import-csv
 *   { email, seller_name?, listings: [{ make, model, year, price, currency,
 *     category, airport, country, description }] }
 *   -> 200 { imported: N, errors: [{ line, error }, ...] }
 *
 * Chaque annonce est insérée avec la clé de service Supabase (contourne la
 * RLS) : status 'pending', seller_email / seller_name du vendeur connecté,
 * submitted_at = now(), views 0, enquiries 0. Une ligne en erreur ne fait pas
 * échouer les autres : les erreurs sont collectées dans `errors`.
 *
 * Variables Vercel requises : SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
 */
function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://aircraft2sell.eu');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'content-type, authorization, apikey');
}

function emailValide(e) {
  return typeof e === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Méthode non autorisée' });
    return;
  }

  const url = process.env.SUPABASE_URL;
  const cle = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !cle) {
    res.status(503).json({ error: 'Configuration Supabase absente' });
    return;
  }

  const corps = req.body || {};
  const email = String(corps.email || '').trim().toLowerCase();
  const sellerName = String(corps.seller_name || '').trim();
  const listings = Array.isArray(corps.listings) ? corps.listings : [];

  if (!emailValide(email)) {
    res.status(400).json({ error: 'Email du vendeur invalide', imported: 0, errors: [] });
    return;
  }
  if (!listings.length) {
    res.status(400).json({ error: 'Aucune annonce à importer', imported: 0, errors: [] });
    return;
  }
  if (listings.length > 100) {
    res.status(400).json({ error: 'Limite de 100 annonces par import', imported: 0, errors: [] });
    return;
  }

  const errors = [];
  let imported = 0;

  for (let i = 0; i < listings.length; i++) {
    const ligne = listings[i] || {};
    const line = i + 2; // 1 = en-tête, donc les données commencent ligne 2
    const make = String(ligne.make || '').trim();
    const model = String(ligne.model || '').trim();
    const price = String(ligne.price ?? '').trim();
    const category = String(ligne.category || '').trim();

    if (!make || !model || !price || !category) {
      errors.push({ line, error: 'Champs requis manquants (make, model, price, category)' });
      continue;
    }
    if (isNaN(Number(price)) || Number(price) < 0) {
      errors.push({ line, error: 'Prix invalide (nombre positif attendu)' });
      continue;
    }

    const row = {
      id: (Date.now() * 1000) + (Math.floor(Math.random() * 999) + 1),
      make,
      model,
      year: ligne.year ? String(ligne.year).trim() : null,
      price,
      currency: String(ligne.currency || 'EUR').trim().toUpperCase(),
      category,
      airport: ligne.airport ? String(ligne.airport).trim().toUpperCase() : null,
      country: ligne.country ? String(ligne.country).trim() : null,
      description: ligne.description ? String(ligne.description).trim() : null,
      status: 'pending',
      seller_email: email,
      seller_name: sellerName || null,
      submitted_at: new Date().toISOString(),
      views: 0,
      enquiries: 0,
    };

    try {
      const r = await fetch(`${url}/rest/v1/listings`, {
        method: 'POST',
        headers: {
          apikey: cle,
          Authorization: `Bearer ${cle}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify(row),
      });
      if (!r.ok) throw new Error(`Supabase ${r.status}`);
      imported++;
    } catch (e) {
      errors.push({ line, error: `Insertion échouée : ${e.message}` });
    }
  }

  res.status(200).json({ imported, errors });
}
