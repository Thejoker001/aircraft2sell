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
 *   GET    /api/listings?mode=seo&id=123&lang=fr -> rendu SSR (audit 05/11/2026,
 *                                            voir modeSeo ci-dessous), AUCUNE clé API
 *                                            requise (lecture publique, mêmes données
 *                                            que la fiche annonce visible par tous)
 *
 * Auth clé API : header  X-API-Key: ***
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
import fs from 'fs';
import path from 'path';
import { esc } from './_lib.js';

/**
 * mode=seo (audit 05/11/2026) — injecte le vrai title/description/og:xxx/canonical
 * + un schema.org Product dans le HTML BRUT d'une fiche annonce AVANT que le JS
 * ne s'exécute. Avant ce fix, le HTML initial affichait un title/description
 * IDENTIQUES sur les 65 annonces (seul le rendu client après fetch Supabase les
 * différenciait) — contenu quasi-dupliqué pour un crawler, cause probable du
 * faible taux d'indexation observé (14/65 indexées, cf. baseline GSC 05/11).
 *
 * Routé depuis /listing.html (et en/, et/) UNIQUEMENT quand ?id= est présent,
 * via les rewrites de vercel.json — sinon le fichier statique est servi tel quel.
 * Reste une fonction GET non authentifiée : lecture publique, exactement les
 * mêmes données que celles déjà visibles par n'importe quel visiteur sur la
 * page une fois le JS exécuté. AUCUNE donnée privée exposée (pas seller_email).
 *
 * Fail-open systématique (template introuvable, Supabase en panne, annonce
 * absente/non "live") : on renvoie le gabarit HTML statique INCHANGÉ plutôt que
 * de casser la page — le rendu client (render() dans le <script> de la page)
 * prend ensuite le relais exactement comme avant ce fix.
 */
const TEMPLATES_SEO = {
  fr: 'listing-page.html',
  en: 'en/listing-page.html',
  et: 'et/listing-page.html',
};
const COPIE_SEO = {
  fr: { pourVente: (t, pr) => `À vendre : ${t}${pr ? ' — ' + pr : ''}. Marketplace aéronautique européenne sans commission.`,
        base: 'https://aircraft2sell.eu/listing.html' },
  en: { pourVente: (t, pr) => `For sale: ${t}${pr ? ' — ' + pr : ''}. European aviation marketplace with zero commission.`,
        base: 'https://aircraft2sell.eu/en/listing.html' },
  et: { pourVente: (t, pr) => `Müügil: ${t}${pr ? ' — ' + pr : ''}. Euroopa lennukiturg, vahendustasuta.`,
        base: 'https://aircraft2sell.eu/et/listing.html' },
};
const SYMBOLE_DEVISE = { EUR: '€', USD: '$', GBP: '£', CHF: 'Fr', CAD: 'CA$', AUD: 'AU$', AED: 'AED ' };
const NOMS_CATEGORIE = { light: 'Avions légers', jet: "Jets d'affaires", turbo: 'Turboprops', heli: 'Hélicoptères', ulm: 'ULM', airliner: 'Avions de ligne' };

async function modeSeo(req, res, url, cle) {
  const lang = ['fr', 'en', 'et'].includes(req.query.lang) ? req.query.lang : 'fr';
  const id = req.query.id ? String(req.query.id).trim() : '';
  const templatePath = path.join(process.cwd(), TEMPLATES_SEO[lang]);

  let html;
  try {
    html = fs.readFileSync(templatePath, 'utf8');
  } catch (e) {
    // Gabarit introuvable (déploiement incomplet) : on ne peut rien servir de
    // sensé ici, mais ça ne doit jamais arriver si includeFiles est correct.
    res.status(500).send('Modèle de page introuvable');
    return;
  }

  if (!id) { res.setHeader('Content-Type', 'text/html; charset=utf-8'); res.status(200).send(html); return; }

  let listing = null;
  try {
    const rows = await sbGet(url, cle, `listings?select=*&id=eq.${encodeURIComponent(id)}&limit=1`);
    listing = rows && rows[0];
  } catch (e) {
    // Supabase indisponible : on sert le gabarit statique inchangé plutôt que
    // de renvoyer une erreur — le rendu client gérera comme d'habitude.
  }

  if (!listing || listing.status !== 'live') {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=60');
    res.status(200).send(html);
    return;
  }

  const copie = COPIE_SEO[lang];
  const sym = SYMBOLE_DEVISE[listing.currency || 'EUR'] || '€';
  const pn = listing.price && !isNaN(Number(listing.price)) ? Number(listing.price) : null;
  const pr = pn ? pn.toLocaleString('fr-FR') + ' ' + sym : (listing.price || null);
  const title = [listing.make, listing.model, listing.year ? `(${listing.year})` : ''].filter(Boolean).join(' ') || 'Aéronef';
  const fullTitle = 'Aircraft2Sell — ' + title;
  const description = copie.pourVente(title, pr);
  const ogTitle = title + ' — Aircraft2Sell';
  const canonicalUrl = copie.base + '?id=' + encodeURIComponent(id);

  html = html.replace(/<title>.*?<\/title>/, `<title>${esc(fullTitle)}</title>`);
  html = html.replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${esc(description)}">`);
  html = html.replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${esc(canonicalUrl)}">`);

  const photos = Array.isArray(listing.photos) ? listing.photos : [];
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: title,
    description: listing.description || 'Aéronef à vendre sur Aircraft2Sell',
    url: canonicalUrl,
    image: photos.length ? photos[0] : 'https://aircraft2sell.eu/og-image.png',
    sku: String(listing.id || ''),
    brand: { '@type': 'Brand', name: listing.make || '' },
    model: listing.model || '',
    productionDate: listing.year ? String(listing.year) : '',
    category: NOMS_CATEGORIE[listing.category] || listing.category || '',
    offers: {
      '@type': 'Offer',
      price: listing.price || '0',
      priceCurrency: listing.currency || 'EUR',
      priceValidUntil: (() => { const d = new Date(); d.setFullYear(d.getFullYear() + 1); return d.toISOString().slice(0, 10); })(),
      validFrom: listing.submitted_at ? String(listing.submitted_at).slice(0, 10) : (listing.created_at ? String(listing.created_at).slice(0, 10) : new Date().toISOString().slice(0, 10)),
      availability: 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/UsedCondition',
      url: canonicalUrl,
    },
  };
  const injection = `<meta property="og:title" content="${esc(ogTitle)}">\n`
    + `<meta property="og:description" content="${esc(description)}">\n`
    + `<meta property="og:url" content="${esc(canonicalUrl)}">\n`
    + `<script type="application/ld+json" id="listing-schema">${JSON.stringify(schema)}</script>\n</head>`;
  html = html.replace('</head>', injection);

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  // Cache court côté edge : contenu quasi-statique (annonce rarement modifiée),
  // mais on ne veut pas non plus geler un changement de prix/statut longtemps.
  res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
  res.status(200).send(html);
}

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

  // Mode SSR (audit 05/11/2026) : rendu public non authentifié d'une fiche
  // annonce avec meta tags réels, routé depuis vercel.json uniquement quand
  // /listing.html (ou en/, et/) porte un ?id=. Voir modeSeo ci-dessus.
  if (req.method === 'GET' && req.query && req.query.mode === 'seo') {
    await modeSeo(req, res, url, cle);
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
      /* Suppression douce (2026-10-08, demande Romain) : alignée sur le
         comportement du dashboard web (dashboard.html/delListing). Une
         annonce supprimée par le vendeur (ici via sa clé API) est comptée
         comme VENDUE (status='sold'), jamais effacée de la base — elle
         alimente le compteur public "aéronefs vendus" de l'accueil
         (api/notify.js?type=stats). Elle reste lisible par le vendeur
         (GET /api/listings) mais disparaît de la recherche publique (RLS :
         anon ne lit que status=live). */
      const chemin = `listings?id=eq.${encodeURIComponent(id)}&seller_email=eq.${emailEnc}`;
      const updated = await sbWrite(url, cle, chemin, 'PATCH', { status: 'sold' }, 'return=representation');
      if (!updated.length) {
        res.status(404).json({ error: "Annonce introuvable ou n'appartenant pas à ce compte" });
        return;
      }
      res.status(200).json({ ok: true, id, status: 'sold' });
      return;
    }

    res.status(405).json({ error: 'Méthode non autorisée' });
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
}
