/**
 * api/register-guard.js
 * Appelé par login.html/en/login.html AVANT la création du compte
 * (fetch /auth/v1/signup). Deux rôles :
 *
 *   1. Bloquer l'inscription si l'email OU l'IP figure dans la liste
 *      noire permanente (public.banned_emails / public.banned_ips).
 *      Rempart en plus du trigger Postgres `block_banned_email_before_insert`
 *      (qui bloque de toute façon l'email au niveau base) : ce garde-fou
 *      ajoute le blocage par IP, impossible à faire dans le trigger
 *      auth.users qui ne connaît pas l'IP de la requête HTTP.
 *   2. Journaliser l'IP vue pour cet email (table signup_ips), pour que
 *      l'admin puisse bannir les IP connues d'un membre au moment où il
 *      le bannit (voir ban_identity_permanently côté admin).
 *
 * Corps accepté : { email } (POST)
 * Réponses :
 *   200 { ok:true }                  -> inscription autorisée, IP journalisée
 *   403 { ok:false, blocked:true }   -> email ou IP banni, NE PAS appeler /auth/v1/signup
 *
 * FAIL-OPEN si Supabase est indisponible (ne doit jamais empêcher une
 * inscription légitime à cause d'un souci d'infra, cf. debitAutorise).
 */
import { preambule, ipClient, debitAutorise } from './_lib.js';

export default async function handler(req, res) {
  if (preambule(req, res)) return;

  try {
    const email = (req.body && req.body.email || '').trim().toLowerCase();
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Email invalide' });
    }
    const ip = ipClient(req);

    // Anti-abus : au plus 8 tentatives d'inscription par IP / 10 min.
    const autorise = await debitAutorise(`register-guard:${ip}`, 8, 600);
    if (!autorise) {
      return res.status(429).json({ ok: false, error: 'Trop de tentatives, réessayez plus tard.' });
    }

    const url = process.env.SUPABASE_URL;
    const cle = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !cle) {
      // Configuration manquante : fail-open, on ne bloque jamais pour ça.
      return res.status(200).json({ ok: true });
    }

    const rpc = await fetch(`${url}/rest/v1/rpc/is_signup_blocked`, {
      method: 'POST',
      headers: { apikey: cle, Authorization: `Bearer ${cle}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_email: email, p_ip: ip }),
    });
    if (rpc.ok) {
      const blocked = await rpc.json();
      if (blocked === true) {
        return res.status(403).json({
          ok: false,
          blocked: true,
          error: "Ce compte a été définitivement banni et ne peut pas être recréé. Contactez contact@aircraft2sell.eu si vous pensez qu'il s'agit d'une erreur.",
        });
      }
    }
    // rpc en échec (table pas encore déployée, etc.) -> fail-open, pas de blocage.

    // Journalise l'IP pour cet email (best-effort, jamais bloquant).
    fetch(`${url}/rest/v1/rpc/log_signup_ip`, {
      method: 'POST',
      headers: { apikey: cle, Authorization: `Bearer ${cle}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_email: email, p_ip: ip }),
    }).catch(() => {});

    return res.status(200).json({ ok: true });
  } catch (e) {
    // Toute erreur inattendue : fail-open (ne jamais bloquer une inscription légitime).
    return res.status(200).json({ ok: true });
  }
}
