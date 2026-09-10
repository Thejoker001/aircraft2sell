/**
 * api/create-checkout.js — Création d'une session de paiement Stripe
 *
 * Les montants sont calculés CÔTÉ SERVEUR (jamais fiables côté client) :
 *   plan : essential (gratuit) / aviateur (29 €) / pro (79 €)
 *   addon Photos+ : +10 € (Essentiel uniquement)
 *   promo : AVIATION2026 (-5 €) / A2S2026 (-10 €)
 *   TVA : Aircraft2Sell OÜ n'est pas assujettie — aucun montant de TVA n'est
 *   collecté (le prix affiché est le prix final).
 *
 *   POST /api/create-checkout
 *   { email, plan, addon?, promo? }
 *   -> { url } (redirection vers Stripe Checkout)
 *
 * Variables Vercel requises : STRIPE_SECRET_KEY, SUPABASE_URL,
 * SUPABASE_SERVICE_ROLE_KEY.
 */
import { preambule } from './_lib.js';

const STRIPE = 'https://api.stripe.com/v1';
const PLANS = {
  essential: { price: 0, label: 'Essentiel' },
  aviateur: { price: 29, label: 'Aviateur' },
  pro: { price: 79, label: 'Pro' },
};
const ADDON_PRICE = 10;
const FEATURE_PRICE = 9;  /* mise en avant d'une annonce 30 jours (paiement unique) */
const PROMOS = { AVIATION2026: 5, A2S2026: 10 };

function eurToCents(n) {
  return Math.round(n * 100);
}

export default async function handler(req, res) {
  if (preambule(req, res)) return;

  const cle = process.env.STRIPE_SECRET_KEY;
  if (!cle) return res.status(503).json({ error: 'STRIPE_SECRET_KEY absente' });

  const c = req.body || {};
  const email = String(c.email || '').trim().toLowerCase();
  const plan = String(c.plan || 'aviateur').toLowerCase();
  const addon = !!c.addon;
  const promo = String(c.promo || '').trim().toUpperCase();
  const featureId = c.feature ? String(c.feature) : '';

  if (!email || email.indexOf('@') === -1) {
    return res.status(400).json({ error: 'Email invalide' });
  }

  /* Mise en avant d'une annonce (B4) : paiement UNIQUE de 9 € pour
     30 jours de featured. La session embarque listing_id en metadata. */
  if (featureId) {
    if (!/^\d+$/.test(featureId)) {
      return res.status(400).json({ error: 'Annonce invalide' });
    }
    const total = FEATURE_PRICE;
    try {
      const form = new URLSearchParams();
      form.set('mode', 'payment');
      form.set('success_url', `https://aircraft2sell.eu/success.html?session_id={CHECKOUT_SESSION_ID}&feature=${featureId}`);
      form.set('cancel_url', 'https://aircraft2sell.eu/cancel.html');
      form.set('client_reference_id', email);
      form.set('customer_email', email);
      form.set('locale', 'fr');
      form.set('line_items[0][price_data][currency]', 'eur');
      form.set('line_items[0][price_data][unit_amount]', String(eurToCents(total)));
      form.set('line_items[0][price_data][product_data][name]', 'Aircraft2Sell — Mise en avant annonce');
      form.set('line_items[0][price_data][product_data][description]',
        'Mise en avant de votre annonce pendant 30 jours. Aucune TVA facturée.');
      form.set('line_items[0][quantity]', '1');
      form.set('metadata[feature]', featureId);
      form.set('metadata[plan]', '');
      const r = await fetch(`${STRIPE}/checkout/sessions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${cle}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: form.toString(),
      });
      const txt = await r.text();
      if (!r.ok) {
        return res.status(502).json({ error: `Stripe ${r.status} : ${txt.slice(0, 200)}` });
      }
      const data = JSON.parse(txt);
      return res.status(200).json({ url: data.url, sessionId: data.id });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  const p = PLANS[plan];
  if (!p) return res.status(400).json({ error: 'Formule inconnue' });

  /* Formule gratuite : pas de session Stripe, retour direct. */
  if (p.price === 0 && !addon) {
    return res.status(200).json({ free: true });
  }

  /* Calcul serveur : sous-total = plan + addon - promo (jamais négatif).
     Aircraft2Sell OÜ n'étant pas assujettie à la TVA, le prix affiché est
     le prix final — aucun montant de TVA n'est ajouté. */
  let sub = p.price;
  if (addon) sub += ADDON_PRICE;
  const remise = PROMOS[promo] || 0;
  sub = Math.max(0, sub - remise);
  const total = sub;

  try {
    /* Session d'abonnement récurrent (mensuel). Le nom de la formule et le
       montant viennent du serveur : le client ne peut pas les modifier. */
    const form = new URLSearchParams();
    form.set('mode', 'subscription');
    form.set('success_url', `https://aircraft2sell.eu/success.html?session_id={CHECKOUT_SESSION_ID}&plan=${plan}`);
    form.set('cancel_url', 'https://aircraft2sell.eu/cancel.html');
    form.set('client_reference_id', email);
    form.set('customer_email', email);
    form.set('locale', 'fr');
    form.set('line_items[0][price_data][currency]', 'eur');
    form.set('line_items[0][price_data][unit_amount]', String(eurToCents(total)));
    form.set('line_items[0][price_data][product_data][name]', `Aircraft2Sell — ${p.label}`);
    form.set('line_items[0][price_data][product_data][description]',
      `Abonnement mensuel ${p.label}${addon ? ' + option Photos+' : ''}${remise ? ` — remise ${remise} €` : ''}. Aucune TVA facturée.`);
    form.set('line_items[0][price_data][recurring][interval]', 'month');
    form.set('line_items[0][quantity]', '1');
    form.set('metadata[plan]', plan);
    form.set('metadata[addon]', addon ? '1' : '0');
    form.set('metadata[promo]', promo || '');

    const r = await fetch(`${STRIPE}/checkout/sessions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cle}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: form.toString(),
    });
    const txt = await r.text();
    if (!r.ok) {
      return res.status(502).json({ error: `Stripe ${r.status} : ${txt.slice(0, 200)}` });
    }
    const data = JSON.parse(txt);
    return res.status(200).json({ url: data.url, sessionId: data.id });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
