/**
 * api/listings.js — API CRUD pour la gestion d'annonces par un système tiers
 * (site/CRM d'un dealer ou broker pro), authentifiée par clé API.
 *
 * CONTEXTE (2026-10-06) : un client pro (volume important) veut gérer ses
 * annonces Aircraft2Sell depuis son propre site. La clé API est générée côté
 * dashboard.html (écriture directe Supabase + RLS, voir supabase/create-api-keys.sql) ;
 * cette fonction ne fait QUE vérifier la clé reçue et scoper toutes les
 * opérations sur le seller_email qui lui est rattaché EN BASE — jamais un
 * email fourni dans le corps de la requête (c'était le trou de sécurité de
 * l'ancien api/import-csv.js, qui faisait confiance à `corps.email` — fusionné
 * ici pour rester à 12/12 fonctions serverless, plafond plan Hobby Vercel,
 * voir SKILL.md § limites plan Hobby).
 *
 *   GET    /api/listings                 -> liste des annonces du vendeur (clé API)
 *   GET    /api/listings?id=123          -> une annonce précise (si elle lui appartient)
 *   POST   /api/listings                 -> crée une annonce (status 'pending', modération)
 *   PATCH  /api/listings?id=123          -> modifie une annonce qui lui appartient
 *   DELETE /api/listings?id=123          -> supprime une annonce qui lui appartient
 *   POST   /api/listings?mode=csv-import -> import CSV en masse depuis le dashboard
 *                                            (mode historique d'import-csv.js, body
 *                                            { email, seller_name?, listings: [...] },
 *                                            jusqu'à 100 lignes — AUCUNE clé API requise
 *                                            ici, c'est le flux dashboard existant)
 *
 * Auth clé API : header  X-API-Key: a2s_live_...
 * Toutes les réponses sont { error } en cas d'échec, sinon la forme documentée
 * par route ci-dessous.
 *
 * Variables Vercel requises : SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
 *
 * Rate limit : en mémoire par process (voir RATE_LIMIT ci-dessous), même
 * principe que api/chat.js — suffisant pour dissuader l'abus, pas un vrai
 * compteur distribué (acceptable : trafic attendu faible, pro unique au
 * lancement de cette fonctionnalité).
 */
import crypto from 'crypto';

function emailValideCsv(e) {
  return typeof e === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

/** Mode historique import-csv.js : import en masse depuis dashboard.html,
 *  identité du vendeur fournie dans le corps (pas de clé API). Conservé à
 *  l'identique pour ne pas casser le flux existant du dashboard. */
async function modeCsvImport(req, res, url, cle) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Méthode non autorisée' });
    return;
  }
  const corps = req.body || {};
  const email = String(corps.email || '').trim().toLowerCase();
  const sellerName = String(corps.seller_name || '').trim();
  const listings = Array.isArray(corps.listings) ? corps.listings : [];

  if (!emailValideCsv(email)) {
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
    const line = i + 2;
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

function cors(res) {
  // Appelé depuis le site TIERS du client, jamais depuis le navigateur
  // aircraft2sell.eu : CORS ouvert, l'authentification repose sur la clé API,
  // pas sur l'origine.
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'content-type, x-api-key');
}

const MAX_PER_WINDOW = 60; // requêtes
const WINDOW_MS = 60_000; // par minute, par clé API
const compteurs = new Map(); // keyHash -> [timestamps]

function rateLimited(keyHash) {
  const now = Date.now();
  const arr = (compteurs.get(keyHash) || []).filter((t) => now - t < WINDOW_MS);
  arr.push(now);
  compteurs.set(keyHash, arr);
  return arr.length > MAX_PER_WINDOW;
}

function sha256(texte) {
  return crypto.createHash('sha256').update(texte, 'utf8').digest('hex');
}

const CATEGORIES_VALIDES = ['light', 'jet', 'turbo', 'heli', 'ulm', 'airliner'];

async function sbGet(url, cle, chemin) {
  const r = await fetch(`${url}/rest/v1/${chemin}`, {
    headers: { apikey: cle, Authorization: `Bearer ${cle}` },
  });
  if (!r.ok) throw new Error(`Supabase ${r.status} : ${(await r.text()).slice(0, 300)}`);
  return r.json();
}

async function sbWrite(url, cle, chemin, methode, corps, prefer) {
  const r = await fetch(`${url}/rest/v1/${chemin}`, {
    method: methode,
    headers: {
      apikey: cle,
      Authorization: `Bearer ${cle}`,
      'Content-Type': 'application/json',
      Prefer: prefer || 'return=representation',
    },
    body: corps !== undefined ? JSON.stringify(corps) : undefined,
  });
  const txt = await r.text();
  if (!r.ok) throw new Error(`Supabase ${r.status} : ${txt.slice(0, 300)}`);
  return txt ? JSON.parse(txt) : null;
}

/** Vérifie la clé API reçue et renvoie le seller_email rattaché, ou null. */
async function authentifier(req, url, cle) {
  const apiKey = String(req.headers['x-api-key'] || '').trim();
  if (!apiKey) return { email: null, keyHash: null, erreur: 'Header X-API-Key requis' };
  const keyHash = sha256(apiKey);
  const rows = await sbGet(
    url,
    cle,
    `api_keys?select=id,seller_email,revoked_at&key_hash=eq.${keyHash}&limit=1`,
  );
  const row = rows && rows[0];
  if (!row) return { email: null, keyHash, erreur: 'Clé API invalide' };
  if (row.revoked_at) return { email: null, keyHash, erreur: 'Clé API révoquée' };
  return { email: row.seller_email, keyHash, apiKeyId: row.id };
}

function nettoyerAnnonce(l) {
  // Jamais exposer seller_email d'un tiers, ni des champs internes de modération
  // non pertinents pour un intégrateur API.
  const { seller_email, ...reste } = l;
  return reste;
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }

  const url = process.env.SUPABASE_URL;
  const cle = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !cle) { res.status(503).json({ error: 'Configuration Supabase absente' }); return; }

  // Mode historique : import CSV depuis le dashboard, pas de clé API (le
  // vendeur est déjà authentifié côté navigateur avant d'arriver ici).
  if (req.query && req.query.mode === 'csv-import') {
    await modeCsvImport(req, res, url, cle);
    return;
  }

  let auth;
  try {
    auth = await authentifier(req, url, cle);
  } catch (e) {
    res.status(502).json({ error: `Vérification de la clé impossible : ${e.message}` });
    return;
  }
  if (!auth.email) { res.status(401).json({ error: auth.erreur }); return; }

  if (rateLimited(auth.keyHash)) {
    res.status(429).json({ error: `Limite de ${MAX_PER_WINDOW} requêtes/minute dépassée` });
    return;
  }

  // Dernière utilisation, best-effort (ne doit jamais faire échouer la requête).
  sbWrite(url, cle, `api_keys?id=eq.${auth.apiKeyId}`, 'PATCH',
    { last_used_at: new Date().toISOString() }, 'return=minimal').catch(() => {});

  const emailEnc = encodeURIComponent(auth.email.toLowerCase());
  const id = req.query && req.query.id ? String(req.query.id).trim() : '';

  try {
    if (req.method === 'GET') {
      const chemin = id
        ? `listings?select=*&id=eq.${encodeURIComponent(id)}&seller_email=eq.${emailEnc}&limit=1`
        : `listings?select=*&seller_email=eq.${emailEnc}&order=submitted_at.desc`;
      const rows = await sbGet(url, cle, chemin);
      if (id) {
        if (!rows.length) { res.status(404).json({ error: 'Annonce introuvable' }); return; }
        res.status(200).json({ listing: nettoyerAnnonce(rows[0]) });
      } else {
        res.status(200).json({ listings: rows.map(nettoyerAnnonce), count: rows.length });
      }
      return;
    }

    if (req.method === 'POST') {
      const corps = req.body || {};
      const make = String(corps.make || '').trim();
      const model = String(corps.model || '').trim();
      const price = corps.price != null ? String(corps.price).trim() : '';
      const category = String(corps.category || '').trim();

      if (!make || !model || !price || !category) {
        res.status(400).json({ error: 'Champs requis manquants : make, model, price, category' });
        return;
      }
      if (isNaN(Number(price)) || Number(price) < 0) {
        res.status(400).json({ error: 'Prix invalide (nombre positif attendu)' });
        return;
      }
      if (!CATEGORIES_VALIDES.includes(category)) {
        res.status(400).json({ error: `category invalide, valeurs acceptées : ${CATEGORIES_VALIDES.join(', ')}` });
        return;
      }

      const row = {
        id: (Date.now() * 1000) + (Math.floor(Math.random() * 999) + 1),
        make,
        model,
        year: corps.year ? String(corps.year).trim() : null,
        price,
        currency: String(corps.currency || 'EUR').trim().toUpperCase(),
        category,
        airport: corps.airport ? String(corps.airport).trim().toUpperCase() : null,
        country: corps.country ? String(corps.country).trim() : null,
        description: corps.description ? String(corps.description).trim() : null,
        photos: Array.isArray(corps.photos) ? corps.photos.slice(0, 20) : [],
        status: 'pending', // même file de modération que le dépôt web — jamais publié directement
        seller_email: auth.email,
        submitted_at: new Date().toISOString(),
        views: 0,
        enquiries: 0,
      };
      const created = await sbWrite(url, cle, 'listings', 'POST', row, 'return=representation');
      res.status(201).json({ listing: nettoyerAnnonce(created[0] || row) });
      return;
    }

    if (req.method === 'PATCH') {
      if (!id) { res.status(400).json({ error: 'Paramètre ?id= requis' }); return; }
      const corps = req.body || {};
      const payload = {};
      const CHAMPS_AUTORISES = [
        'make', 'model', 'year', 'price', 'currency', 'category', 'airport',
        'country', 'description', 'photos', 'status',
      ];
      for (const champ of CHAMPS_AUTORISES) {
        if (corps[champ] !== undefined) payload[champ] = corps[champ];
      }
      if (payload.status !== undefined && !['live', 'pending', 'sold'].includes(payload.status)) {
        // 'rejected' reste réservé à la modération admin, jamais choisi par l'API tierce.
        res.status(400).json({ error: `status invalide via l'API (live, pending ou sold uniquement)` });
        return;
      }
      if (payload.price !== undefined) {
        if (isNaN(Number(payload.price)) || Number(payload.price) < 0) {
          res.status(400).json({ error: 'Prix invalide' });
          return;
        }
      }
      if (payload.category !== undefined && !CATEGORIES_VALIDES.includes(payload.category)) {
        res.status(400).json({ error: `category invalide, valeurs acceptées : ${CATEGORIES_VALIDES.join(', ')}` });
        return;
      }
      if (!Object.keys(payload).length) {
        res.status(400).json({ error: 'Aucun champ modifiable fourni' });
        return;
      }

      // Scope strict : filtre seller_email EN PLUS de id, pour ne jamais
      // modifier l'annonce d'un autre vendeur même si l'id est deviné.
      const chemin = `listings?id=eq.${encodeURIComponent(id)}&seller_email=eq.${emailEnc}`;
      const updated = await sbWrite(url, cle, chemin, 'PATCH', payload, 'return=representation');
      if (!updated.length) {
        res.status(404).json({ error: "Annonce introuvable ou n'appartenant pas à ce compte" });
        return;
      }
      res.status(200).json({ listing: nettoyerAnnonce(updated[0]) });
      return;
    }

    if (req.method === 'DELETE') {
      if (!id) { res.status(400).json({ error: 'Paramètre ?id= requis' }); return; }
      const chemin = `listings?id=eq.${encodeURIComponent(id)}&seller_email=eq.${emailEnc}`;
      const deleted = await sbWrite(url, cle, chemin, 'DELETE', undefined, 'return=representation');
      if (!deleted.length) {
        res.status(404).json({ error: "Annonce introuvable ou n'appartenant pas à ce compte" });
        return;
      }
      res.status(200).json({ ok: true, id });
      return;
    }

    res.status(405).json({ error: 'Méthode non autorisée' });
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
}
