/**
 * api/diag-email.js
 * Vérifie la configuration des notifications sans envoyer d'email.
 *
 *   GET /api/diag-email?cle=<ADMIN_DIAG_KEY>
 *
 * Contrôle : variables d'environnement, accès Supabase, accès Brevo
 * (et notamment la restriction « Authorised IPs » qui bloque les IP
 * dynamiques de Vercel).
 */
import { cors } from './_lib.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }

  /* Protection minimale : ce diagnostic révèle l'état de la configuration. */
  const attendue = process.env.ADMIN_DIAG_KEY;
  const fournie = (req.query && req.query.cle) || '';
  if (attendue && fournie !== attendue) {
    return res.status(403).json({ error: 'Clé de diagnostic invalide' });
  }

  const r = { variables: {}, supabase: null, brevo: null };

  for (const v of ['BREVO_API_KEY', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY',
                   'ADMIN_EMAIL', 'BREVO_FROM']) {
    r.variables[v] = process.env[v] ? 'définie' : 'ABSENTE';
  }

  /* Supabase : lecture d'une annonce */
  try {
    const url = process.env.SUPABASE_URL;
    const cle = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const q = await fetch(`${url}/rest/v1/listings?select=id&limit=1`,
      { headers: { apikey: cle, Authorization: `Bearer ${cle}` } });
    r.supabase = q.ok ? 'accessible' : `erreur HTTP ${q.status}`;
  } catch (e) {
    r.supabase = `injoignable : ${e.message}`;
  }

  /* Brevo : le compte répond-il depuis CETTE IP ? */
  try {
    const q = await fetch('https://api.brevo.com/v3/account',
      { headers: { 'api-key': process.env.BREVO_API_KEY || '' } });
    const txt = await q.text();
    if (q.ok) {
      let credits = null;
      try {
        const d = JSON.parse(txt);
        credits = (d.plan || []).map(p => `${p.type}: ${p.credits}`).join(', ');
      } catch { /* réponse inattendue */ }
      r.brevo = { etat: 'accessible', quota: credits };
    } else if (q.status === 401 && /unrecognised IP address/i.test(txt)) {
      const ip = (txt.match(/IP address ([\d.]+)/) || [])[1] || 'inconnue';
      r.brevo = {
        etat: 'BLOQUE',
        cause: `Brevo refuse l'IP ${ip}`,
        correction: 'Brevo → Paramètres → Sécurité → Adresses IP autorisées : ' +
                    'désactiver la restriction (les fonctions Vercel n\'ont pas d\'IP fixe).',
      };
    } else {
      r.brevo = { etat: `erreur HTTP ${q.status}`, detail: txt.slice(0, 160) };
    }
  } catch (e) {
    r.brevo = { etat: `injoignable : ${e.message}` };
  }

  const ok = r.brevo?.etat === 'accessible' && r.supabase === 'accessible';
  return res.status(ok ? 200 : 503).json({ ok, ...r });
}
