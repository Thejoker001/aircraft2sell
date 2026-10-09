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

/* Empêche Vercel de parser automatiquement le JSON en objet — la
   vérification de signature Stripe exige le corps BRUT, octet pour octet,
   tel qu'envoyé. JSON.stringify(objet reparsé) ne correspond PAS forcément
   au texte original (ordre des clés, espaces, unicode) : la signature HMAC
   échouait silencieusement sur les paiements réels (pending_webhooks bloqué
   côté Stripe), alors que des tests manuels avec un payload trivial
   « marchaient » par coïncidence. */
export const config = { api: { bodyParser: false } };

function lireCorpsBrut(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => { data += chunk; });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  /* Le webhook Stripe envoie un body brut (pas du JSON par défaut) et la
     signature dans l'en-tête stripe-signature. */
  let raw = '';
  try {
    raw = await lireCorpsBrut(req);
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

      /* Mention TVA sur toute facture future : la société n'est pas
         assujettie à la TVA (sous le seuil d'immatriculation estonien).
         Appliqué sur l'abonnement créé (vendeurs ET partenaires, quelle
         que soit la source — Payment Link ou /api/create-checkout) pour
         que Stripe l'affiche automatiquement sur chaque facture récurrente
         sans action manuelle. Best-effort : une erreur ici ne doit jamais
         bloquer le reste du traitement du paiement. */
      if (session.subscription && process.env.STRIPE_SECRET_KEY) {
        fetch(`${STRIPE}/subscriptions/${session.subscription}`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: 'invoice_settings[footer]=' + encodeURIComponent(
            "Aircraft2Sell OÜ is not registered for VAT / n'est pas assujettie à la TVA."
          ),
        }).catch((e) => console.error('footer TVA subscription:', e.message));
      }
      const plan = (session.metadata && session.metadata.plan) || 'aviateur';
      const addon = (session.metadata && session.metadata.addon) === '1';
      const featureId = (session.metadata && session.metadata.feature) || '';

      /* Mise en avant d'annonce (B4) : paiement unique, pas d'abonnement.
         Action directe (PATCH listings featured) — plus de fonction
         feature-listing.js (limite Hobby de 12 fonctions serverless). */
      if (featureId) {
        try {
          await fetch(`${process.env.SUPABASE_URL}/rest/v1/listings?id=eq.${encodeURIComponent(featureId)}`, {
            method: 'PATCH',
            headers: {
              apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
              Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
              'Content-Type': 'application/json',
              Prefer: 'return=minimal',
            },
            body: JSON.stringify({ featured: true, featured_until: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString() }),
          });
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
        } catch (featErr) {
          console.error('feature activation error:', featErr.message);
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

  /* Copie de chaque facture émise (client + admin). Déclenché à chaque
     facture payée — abonnement vendeur, Pro, ou Payment Link partenaire,
     peu importe la source. L'événement est déjà activé côté Stripe
     (voir webhook_endpoints) ; il manquait juste le traitement ici. */
  if (event.type === 'invoice.payment_succeeded') {
    try {
      const invoice = event.data.object || {};
      const email = (invoice.customer_email || '').trim();
      const nom = invoice.customer_name || email || 'Client';
      const numero = invoice.number || invoice.id;
      const montant = ((invoice.amount_paid || 0) / 100).toLocaleString('fr-FR');
      const devise = (invoice.currency || 'eur').toUpperCase();
      const lienFacture = invoice.hosted_invoice_url || invoice.invoice_pdf || '';
      const lienPdf = invoice.invoice_pdf || '';

      if (email && lienFacture) {
        envoyer({
          to: email,
          toName: nom,
          sujet: `Votre facture Aircraft2Sell n°${numero}`,
          html: gabarit({
            titre: 'Facture',
            intro: `Merci pour votre paiement de <strong>${montant} ${devise}</strong>. ` +
                   `Voici votre facture n°${esc(numero)}.`,
            cta: lienFacture,
            ctaLabel: 'Voir / télécharger la facture',
          }),
        }).catch((e) => console.error('email facture client:', e.message));
      }

      envoyer({
        to: ADMIN_EMAIL,
        toName: 'Administration Aircraft2Sell',
        sujet: `Copie facture n°${numero} — ${email || 'client inconnu'}`,
        html: gabarit({
          titre: 'Copie de facture émise',
          intro: `Facture n°${esc(numero)} — <strong>${montant} ${devise}</strong> — ` +
                 `client : ${esc(email || 'inconnu')} (${esc(nom)}).`,
          cta: lienFacture || lienPdf,
          ctaLabel: 'Voir la facture',
        }),
      }).catch((e) => console.error('email facture admin:', e.message));
    } catch (e) {
      console.error('webhook invoice.payment_succeeded:', e.message);
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    try {
      const sub = event.data.object || {};
      const cusId = sub.customer;
      if (cusId && process.env.STRIPE_SECRET_KEY) {
        const r = await fetch(`${STRIPE}/customers/${cusId}`, {
          headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` },
        });
        if (r.ok) {
          const cust = await r.json();
          const email = String(cust.email || '').trim().toLowerCase();
          if (email) {
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
                body: JSON.stringify({ plan: 'Essentiel', is_pro: false }),
              });
            }
          }
        }
      }
    } catch (e) {
      console.error('webhook subscription.deleted:', e.message);
    }
  }

  /* Toujours accuser réception (200) pour les événements connus/ignorés. */
  return res.status(200).json({ received: true });
}
