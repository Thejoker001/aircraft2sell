/**
 * api/stripe-webhook.js — Confirmation de paiement Stripe
 *
 * Reçoit les événements Stripe (checkout.session.completed) et met à jour
 * le plan de l'utilisateur dans Supabase. La signature est vérifiée avec
 * le secret de webhook (STRIPE_WEBHOOK_SECRET) — sans lui, un attaquant
 * pourrait marquer n'importe quel compte comme payant.
 *
 *   POST /api/stripe-webhook   (headers stripe-signature obligatoires)
 *
 * Variables Vercel requises : STRIPE_WEBHOOK_SECRET, STRIPE_SECRET_KEY
 * (pour récupérer la session), SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
 */
import { sb, envoyer, gabarit, esc, ADMIN_EMAIL, SITE } from './_lib.js';

const STRIPE = 'https://api.stripe.com/v1';

export default async function handler(req, res) {
  /* Le webhook Stripe envoie un body brut (pas du JSON par défaut) et la
     signature dans l'en-tête stripe-signature. */
  let raw = '';
  try {
    raw = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
  } catch (e) {
    raw = '';
  }

  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = req.headers['stripe-signature'] || '';

  if (!secret) {
    /* Webhook pas encore configuré : on refuse proprement (500 pour que
       Stripe réessaie plus tard) au lieu d'accepter n'importe quoi. */
    return res.status(500).json({ error: 'STRIPE_WEBHOOK_SECRET non configuré' });
  }

  try {
    /* Vérification de signature (construction manuelle t=...,v1=...) */
    const parts = {};
    signature.split(',').forEach((p) => {
      const [k, v] = p.split('=');
      if (k) parts[k.trim()] = (v || '').trim();
    });
    const t = parts.t || '';
    const v1 = parts.v1 || '';
    const signed = `${t}.${raw}`;
    const crypto = await import('node:crypto');
    const expected = crypto.createHmac('sha256', secret).update(signed).digest('hex');
    const okSig = v1.length > 0 && expected.length === v1.length &&
      crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(v1));

    /* Tolérance de 5 minutes sur l'horodatage. */
    const now = Math.floor(Date.now() / 1000);
    const age = Math.abs(now - parseInt(t, 10) || 0);
    if (!okSig || age > 300) {
      return res.status(400).json({ error: 'Signature invalide' });
    }
  } catch (e) {
    return res.status(400).json({ error: 'Signature invalide' });
  }

  let event;
  try {
    event = JSON.parse(raw);
  } catch (e) {
    return res.status(400).json({ error: 'JSON invalide' });
  }

  /* On ne traite que les événements utiles. */
  if (event.type === 'checkout.session.completed') {
    try {
      const session = event.data.object || {};
      const email = session.client_reference_id || session.customer_details?.email || '';
      const plan = (session.metadata && session.metadata.plan) || 'aviateur';
      const addon = (session.metadata && session.metadata.addon) === '1';
      const featureId = (session.metadata && session.metadata.feature) || '';

      /* Mise en avant d'annonce (B4) : paiement unique, pas d'abonnement. */
      if (featureId) {
        const featRes = await fetch(`${SITE}/api/feature-listing`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-feature-secret': process.env.FEATURE_SECRET || '' },
          body: JSON.stringify({ listing_id: String(featureId) }),
        });
        if (featRes.ok) {
          if (email) {
            await envoyer({
              to: email,
              toName: email,
              sujet: 'Votre annonce est en vedette — Aircraft2Sell',
              html: gabarit({
                titre: 'Annonce mise en avant',
                intro: 'Votre annonce est <strong>en vedette</strong> sur Aircraft2Sell pour 30 jours. Elle apparaît en tête des recherches.',
                cta: `${SITE}/dashboard.html`,
                ctaLabel: 'Voir mon tableau de bord',
              }),
            }).catch(() => {});
          }
        }
        return res.status(200).json({ received: true, feature: featureId });
      }

      if (email) {
        const planFinal = plan === 'pro' ? 'Pro' : 'Aviateur';
        const rows = await sb(`users?email=eq.${encodeURIComponent(email)}&select=id&limit=1`);
        const user = rows && rows[0];
        if (user) {
          await fetch(`${process.env.SUPABASE_URL}/rest/v1/users?id=eq.${user.id}`, {
            method: 'PATCH',
            headers: {
              apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
              Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
              'Content-Type': 'application/json',
              Prefer: 'return=minimal',
            },
            body: JSON.stringify({
              plan: planFinal,
              is_pro: plan === 'pro',
              is_free: false,
              addon_photos: addon || null,
            }),
          });
        }

        /* Confirmation au client + notification admin (best-effort). */
        envoyer({
          to: email,
          toName: email,
          sujet: `Votre abonnement ${planFinal} est actif — Aircraft2Sell`,
          html: gabarit({
            titre: 'Paiement confirmé',
            intro: `Votre abonnement <strong>${planFinal}</strong> est actif. Merci de votre confiance !`,
            cta: `${SITE}/dashboard.html`,
            ctaLabel: 'Accéder à mon espace',
          }),
        }).catch(() => {});
        envoyer({
          to: ADMIN_EMAIL,
          toName: 'Administration Aircraft2Sell',
          sujet: `Nouveau paiement ${planFinal} — ${email}`,
          html: gabarit({
            titre: `Nouvel abonnement ${planFinal}`,
            intro: `${esc(email)} vient de souscrire à la formule ${planFinal}${addon ? ' + Photos+' : ''}.`,
          }),
        }).catch(() => {});
      }
    } catch (e) {
      /* Une erreur de traitement ne doit pas faire renvoyer 500 à Stripe
         (sinon il rejoue l'événement indéfiniment) : on loggue et on
         accuse réception. */
      console.error('webhook checkout.session.completed:', e.message);
    }
  }

  /* Toujours accuser réception (200) pour les événements connus/ignorés. */
  return res.status(200).json({ received: true });
}
