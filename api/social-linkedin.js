/**
 * api/social-linkedin.js — OAuth 2.0 LinkedIn (Company Page) + publication.
 *
 * Une seule fonction pour rester sous la limite Hobby de 12 fonctions
 * serverless (même stratégie que api/notify.js, api/cron-jobs.js,
 * api/forms.js). Routage par ?action= :
 *
 *   GET  /api/social-linkedin?action=start&key=<ADMIN_DIAG_KEY>
 *        -> redirige vers la page de consentement LinkedIn (à ouvrir
 *           manuellement dans un navigateur, une seule fois).
 *
 *   GET  /api/social-linkedin?action=callback&code=...&state=...
 *        -> callback OAuth : échange le code contre un access_token +
 *           refresh_token, récupère l'org_urn de la Company Page via
 *           /rest/organizationAcls, stocke tout dans Supabase
 *           (table social_tokens, service_role uniquement).
 *           C'est LinkedIn qui appelle cette route, jamais un humain.
 *
 *   POST /api/social-linkedin?action=post&key=<CRON_SECRET ou x-vercel-cron>
 *        body: { text: "..." }
 *        -> publie un post texte au nom de la Company Page (utilisé par
 *           Rio pour publier ce qui est aujourd'hui dans
 *           rio/posts_en_attente.md).
 *
 *   GET  /api/social-linkedin?action=status&key=<ADMIN_DIAG_KEY>
 *        -> diagnostic : token présent ? expiré ? org_urn connu ?
 *
 * Variables d'environnement Vercel requises :
 *   LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET
 *   LINKEDIN_REDIRECT_URI      https://aircraft2sell.eu/api/social-linkedin?action=callback
 *   ADMIN_DIAG_KEY             déjà existant, réutilisé pour protéger action=start/status
 *   CRON_SECRET                déjà existant, réutilisé pour protéger action=post
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * Sécurité : le Client Secret et les tokens LinkedIn ne transitent JAMAIS
 * côté navigateur — cette fonction est le seul point qui les manipule.
 */

const CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;
const CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET;
const REDIRECT_URI = process.env.LINKEDIN_REDIRECT_URI || 'https://aircraft2sell.eu/api/social-linkedin?action=callback';
const ADMIN_DIAG_KEY = process.env.ADMIN_DIAG_KEY;
const CRON_SECRET = process.env.CRON_SECRET;
const SB_URL = process.env.SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const SCOPES = ['w_organization_social', 'r_organization_social', 'rw_organization_admin'];

function sb(path, options) {
  options = options || {};
  const headers = Object.assign({
    apikey: SB_KEY,
    Authorization: 'Bearer ' + SB_KEY,
    'Content-Type': 'application/json',
  }, options.headers || {});
  return fetch(SB_URL + '/rest/v1/' + path, Object.assign({}, options, { headers }));
}

async function getStoredToken() {
  const r = await sb('social_tokens?provider=eq.linkedin&select=*&limit=1');
  if (!r.ok) return null;
  const rows = await r.json();
  return rows && rows[0] ? rows[0] : null;
}

async function upsertToken(row) {
  return sb('social_tokens', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify(Object.assign({ provider: 'linkedin', updated_at: new Date().toISOString() }, row)),
  });
}

/** Rafraîchit l'access_token si besoin (LinkedIn : access_token ~60 jours,
 *  refresh_token ~1 an). Retourne un access_token valide ou null. */
async function ensureFreshToken() {
  const t = await getStoredToken();
  if (!t) return null;
  const now = Date.now();
  const expOk = !t.expires_at || new Date(t.expires_at).getTime() - now > 5 * 60 * 1000;
  if (expOk) return t;
  if (!t.refresh_token) return null;

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: t.refresh_token,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
  });
  const r = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  if (!r.ok) return null;
  const d = await r.json();
  const updated = {
    access_token: d.access_token,
    refresh_token: d.refresh_token || t.refresh_token,
    expires_at: new Date(now + (d.expires_in || 0) * 1000).toISOString(),
    refresh_expires_at: d.refresh_token_expires_in ? new Date(now + d.refresh_token_expires_in * 1000).toISOString() : t.refresh_expires_at,
    org_urn: t.org_urn,
    org_name: t.org_name,
    scope: t.scope,
  };
  await upsertToken(updated);
  return updated;
}

/* ── action=start : redirige vers l'écran de consentement LinkedIn ── */
function handleStart(req, res) {
  if (req.query.key !== ADMIN_DIAG_KEY) {
    return res.status(403).json({ error: 'Clé admin invalide' });
  }
  if (!CLIENT_ID) {
    return res.status(500).json({ error: 'LINKEDIN_CLIENT_ID absent côté serveur' });
  }
  const state = Math.random().toString(36).slice(2) + Date.now().toString(36);
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    state,
    scope: SCOPES.join(' '),
  });
  res.writeHead(302, { Location: 'https://www.linkedin.com/oauth/v2/authorization?' + params.toString() });
  res.end();
}

/* ── action=callback : LinkedIn redirige ici après consentement ── */
async function handleCallback(req, res) {
  const { code, error, error_description } = req.query;
  if (error) {
    return res.status(400).send(`<h1>Échec LinkedIn</h1><p>${error} : ${error_description || ''}</p>`);
  }
  if (!code) {
    return res.status(400).send('<h1>Code manquant</h1>');
  }
  if (!CLIENT_ID || !CLIENT_SECRET) {
    return res.status(500).send('<h1>Configuration LinkedIn absente côté serveur</h1>');
  }

  try {
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    });
    const tr = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
    const td = await tr.json();
    if (!tr.ok || !td.access_token) {
      return res.status(502).send(`<h1>Échange du code échoué</h1><pre>${JSON.stringify(td)}</pre>`);
    }

    /* Récupérer l'org_urn de la Company Page administrée par ce compte
       (organizationAcls avec role=ADMINISTRATOR). */
    let orgUrn = null, orgName = null;
    try {
      const ar = await fetch(
        'https://api.linkedin.com/rest/organizationAcls?q=roleAssignee&role=ADMINISTRATOR&state=APPROVED',
        { headers: { Authorization: 'Bearer ' + td.access_token, 'LinkedIn-Version': '202401', 'X-Restli-Protocol-Version': '2.0.0' } }
      );
      if (ar.ok) {
        const ad = await ar.json();
        const el = ad.elements && ad.elements[0];
        if (el && el.organization) {
          orgUrn = el.organization;
          const oid = orgUrn.split(':').pop();
          const orr = await fetch(`https://api.linkedin.com/rest/organizations/${oid}`, {
            headers: { Authorization: 'Bearer ' + td.access_token, 'LinkedIn-Version': '202401', 'X-Restli-Protocol-Version': '2.0.0' },
          });
          if (orr.ok) {
            const ord = await orr.json();
            orgName = (ord.localizedName) || null;
          }
        }
      }
    } catch (e) { /* org_urn reste null, on stocke quand même le token */ }

    const now = Date.now();
    await upsertToken({
      access_token: td.access_token,
      refresh_token: td.refresh_token || null,
      expires_at: new Date(now + (td.expires_in || 0) * 1000).toISOString(),
      refresh_expires_at: td.refresh_token_expires_in ? new Date(now + td.refresh_token_expires_in * 1000).toISOString() : null,
      org_urn: orgUrn,
      org_name: orgName,
      scope: (td.scope || SCOPES.join(',')),
    });

    return res.status(200).send(
      `<h1>Connexion LinkedIn réussie</h1><p>Page : ${orgName || '(nom non résolu)'}<br>URN : ${orgUrn || '(non résolu — vérifier les droits admin de la page)'}</p><p>Vous pouvez fermer cet onglet.</p>`
    );
  } catch (e) {
    return res.status(500).send(`<h1>Erreur serveur</h1><pre>${e.message}</pre>`);
  }
}

/* ── action=status : diagnostic rapide ── */
async function handleStatus(req, res) {
  if (req.query.key !== ADMIN_DIAG_KEY) {
    return res.status(403).json({ error: 'Clé admin invalide' });
  }
  const t = await getStoredToken();
  if (!t) return res.status(200).json({ connected: false });
  return res.status(200).json({
    connected: true,
    org_name: t.org_name,
    org_urn: t.org_urn,
    expires_at: t.expires_at,
    refresh_expires_at: t.refresh_expires_at,
    scope: t.scope,
  });
}

/* ── action=post : publie un post texte simple sur la Company Page ── */
async function handlePost(req, res) {
  const cronOk = req.headers['x-vercel-cron'] === '1';
  const keyOk = req.query.key && CRON_SECRET && req.query.key === CRON_SECRET;
  if (!cronOk && !keyOk) {
    return res.status(403).json({ error: 'Non autorisé' });
  }
  const text = (req.body && req.body.text ? String(req.body.text) : '').trim();
  if (!text) return res.status(400).json({ error: 'text manquant' });
  if (text.length > 3000) return res.status(400).json({ error: 'text trop long (3000 caractères max)' });

  const t = await ensureFreshToken();
  if (!t || !t.access_token) return res.status(409).json({ error: 'LinkedIn non connecté ou token expiré — relancer action=start' });
  if (!t.org_urn) return res.status(409).json({ error: 'org_urn inconnu — reconnecter LinkedIn (droits admin Company Page requis)' });

  try {
    const r = await fetch('https://api.linkedin.com/rest/posts', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + t.access_token,
        'Content-Type': 'application/json',
        'LinkedIn-Version': '202401',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify({
        author: t.org_urn,
        commentary: text,
        visibility: 'PUBLIC',
        distribution: { feedDistribution: 'MAIN_FEED', targetEntities: [], thirdPartyDistributionChannels: [] },
        lifecycleState: 'PUBLISHED',
        isReshareDisabledByAuthor: false,
      }),
    });
    if (!r.ok) {
      const errTxt = await r.text();
      return res.status(502).json({ error: `LinkedIn ${r.status} : ${errTxt.slice(0, 300)}` });
    }
    const postId = r.headers.get('x-restli-id') || r.headers.get('x-linkedin-id') || null;
    return res.status(200).json({ ok: true, post_id: postId });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

module.exports = async function handler(req, res) {
  const action = (req.query && req.query.action) || '';
  if (!SB_URL || !SB_KEY) {
    return res.status(500).json({ error: 'Configuration Supabase absente' });
  }
  if (action === 'start') return handleStart(req, res);
  if (action === 'callback') return handleCallback(req, res);
  if (action === 'status') return handleStatus(req, res);
  if (action === 'post') return handlePost(req, res);
  return res.status(400).json({ error: 'action manquante ou invalide (start | callback | status | post)' });
};
