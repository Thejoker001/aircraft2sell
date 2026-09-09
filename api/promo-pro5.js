/**
 * api/promo-pro5.js
 * Offre de lancement liée à la campagne de prospection : "Pro offert à vie"
 * pour les 5 premières personnes qui s'inscrivent en cliquant depuis un email
 * de campagne (même mécanisme d'acceptation en un clic : le lien de l'email
 * porte le marqueur de campagne, le compte est créé, et l'attribution est
 * faite si une place est encore disponible).
 *
 * ATTRIBUTION ATOMIQUE : la fonction SQL public.grant_promo_campaign utilise
 * un verrou advisory + un INSERT avec contrainte unique -> jamais plus de
 * TOTAL_PLACES grants, même avec des inscriptions simultanées. Idempotente :
 * un même email ne peut pas consommer deux places.
 *
 * Corps accepté : { email } (POST)
 * Réponses :
 *   GET  -> { ok, remaining, total }         (compteur public, sans données perso)
 *   POST -> { ok, granted, remaining, rank? }
 */
import { preambule, sb, envoyer, gabarit, esc, ADMIN_EMAIL, SITE } from './_lib.js';

const TOTAL_PLACES = 5;
const CAMPAGNE = 'pro5-prospection-2026-09';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const lignes = await sb(
        `promo_campaign_grants?campaign=eq.${CAMPAGNE}&select=rank`
      );
      const compteur = Array.isArray(lignes) ? lignes.length : 0;
      const remaining = Math.max(0, TOTAL_PLACES - compteur);
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
      return res.status(200).json({ ok: true, remaining, total: TOTAL_PLACES });
    } catch (e) {
      return res.status(200).json({ ok: true, remaining: TOTAL_PLACES, total: TOTAL_PLACES });
    }
  }
  if (preambule(req, res)) return;

  try {
    const email = (req.body && req.body.email || '').trim().toLowerCase();
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Email invalide' });
    }

    // Attribution atomique via la fonction SQL (verrou advisory).
    const rpc = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/rpc/grant_promo_campaign`,
      {
        method: 'POST',
        headers: {
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: 'Bearer ' + process.env.SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ p_email: email, p_campaign: CAMPAGNE, p_total: TOTAL_PLACES }),
      }
    );
    if (!rpc.ok) {
      return res.status(502).json({ error: `Supabase ${rpc.status} : ${(await rpc.text()).slice(0, 200)}` });
    }
    const lignes = await rpc.json();
    /* PostgREST renvoie un objet JSON (pas un tuple composite textuel) :
       [{"rang":1,"deja_accorde":false,"complet":false}]. Ancien format
       "(1,f,f)" attendu — bug d'interface constaté en prod (502). */
    const row = Array.isArray(lignes) ? lignes[0] : lignes;
    let rang = 0, dejaAccorde = false, complet = false;
    if (row && typeof row === 'object' && typeof row.rang === 'number') {
      rang = row.rang;
      dejaAccorde = !!row.deja_accorde;
      complet = !!row.complet;
    } else {
      const tuple = row && row.grant_promo_campaign;
      const m = tuple && tuple.match(/^\((\d+),([tf]),([tf])\)$/);
      if (!m) {
        return res.status(502).json({ error: 'Réponse inattendue de la fonction SQL' });
      }
      rang = parseInt(m[1], 10);
      dejaAccorde = m[2] === 't';
      complet = m[3] === 't';
    }
    const remaining = Math.max(0, TOTAL_PLACES - rang);

    if (!dejaAccorde && !complet && rang >= 1) {
      // Nouvelle attribution : marquer le compte comme Pro offert + notifier.
      try {
        const users = await sb(`users?email=eq.${encodeURIComponent(email)}&select=id,name,email,is_free,is_pro&limit=1`);
        const user = users && users[0];
        if (user) {
          await fetch(`${process.env.SUPABASE_URL}/rest/v1/users?id=eq.${user.id}`, {
            method: 'PATCH',
            headers: {
              apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
              Authorization: 'Bearer ' + process.env.SUPABASE_SERVICE_ROLE_KEY,
              'Content-Type': 'application/json',
              Prefer: 'return=minimal',
            },
            body: JSON.stringify({ is_free: true, is_pro: true, plan: 'Pro' }),
          });
        }
        if (user && user.email) {
          const html = gabarit({
            titre: 'Abonnement Pro offert à vie',
            intro: `Bonne nouvelle : vous faites partie des ${TOTAL_PLACES} premiers professionnels
              inscrits sur Aircraft2Sell. Votre abonnement <strong>Pro est offert, sans limite de
              durée</strong> — annonces illimitées, badge vendeur certifié, mise en avant
              prioritaire, zéro commission sur vos ventes.`,
            blocs: [
              ['Formule', 'Pro — offert à vie'],
              ['Rang', `${rang}${rang === 1 ? 'er' : 'ème'} inscription`],
            ],
            cta: `${SITE}/post-listing.html`,
            ctaLabel: 'Publier ma première annonce',
            pied: `Cet avantage est lié à votre compte (${esc(email)}) et ne peut pas être transféré.`,
          });
          const rEmail = await envoyer({
            to: user.email,
            toName: user.name || email,
            sujet: 'Aircraft2Sell — votre abonnement Pro est offert à vie',
            html,
          });
          if (!rEmail.ok) console.warn('promo-pro5: email non envoyé —', rEmail.erreur);
        }
      } catch (e) {
        // L'attribution est déjà faite en base ; un échec de marquage/email ne
        // doit jamais faire échouer la réponse.
        console.warn('promo-pro5: post-attribution échoué —', e.message);
      }

      envoyer({
        to: ADMIN_EMAIL,
        toName: 'Administration Aircraft2Sell',
        sujet: `Promo Pro5 — place ${rang}/${TOTAL_PLACES} attribuée`,
        html: gabarit({
          titre: `Place ${rang}/${TOTAL_PLACES} attribuée`,
          intro: `Le compte ${esc(email)} vient de recevoir l'abonnement Pro offert à vie via la campagne de prospection.`,
        }),
      }).catch(() => {});
    }

    return res.status(200).json({
      ok: true,
      granted: rang >= 1 && !complet,
      already: dejaAccorde,
      remaining,
      rank: rang >= 1 ? rang : undefined,
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
