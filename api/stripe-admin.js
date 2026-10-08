/**
 * api/stripe-admin.js — Données Stripe réelles pour le panneau admin
 * + relance du lien de paiement partenaire (2026-10-08).
 *
 * La clé secrète Stripe vit UNIQUEMENT côté serveur (env Vercel
 * STRIPE_SECRET_KEY) — jamais exposée au navigateur. L'accès est
 * restreint au compte admin (JWT Supabase + email contact@).
 *
 *   GET /api/stripe-admin
 *   Authorization: Bearer *** admin Supabase>
 *   -> { live, total_revenue, currency, customers_count, mrr, payments[], ... }
 *
 *   POST /api/stripe-admin
 *   Authorization: Bearer *** admin Supabase>
 *   { action: 'resend-partner-link', tier, email, company, name? }
 *   -> { ok: true } — envoie par email (Brevo) le Payment Link Stripe
 *      correspondant au palier. Utilisé depuis l'onglet Partenaires
 *      (fiche partenaire → « Renvoyer le lien de paiement ») quand un
 *      partenaire n'a pas encore payé ou doit régler un renouvellement.
 *      Fusionné ici (plutôt qu'une nouvelle fonction) pour rester sous
 *      le plafond de 12 fonctions serverless du plan Vercel Hobby.
 *
 * Variables Vercel requises en plus : BREVO_API_KEY, BREVO_FROM (optionnel).
 *
 * Limite connue : ces Payment Links sont statiques (créés une fois dans
 * le Dashboard Stripe, cf. partenaires-stripe-payment-links.md à la racine
 * du workspace) — aucune donnée de montant/palier n'est recalculée ici,
 * on se contente de renvoyer l'URL déjà existante par email.
 */
const STRIPE = 'https://api.stripe.com/v1';
const BREVO = 'https://api.brevo.com/v3/smtp/email';
const SITE = 'https://aircraft2sell.eu';

/* Payment Links LIVE créés le 2026-10-08 (abonnement mensuel EUR) —
   voir ~/workspace/partenaires-stripe-payment-links.md pour le détail
   des Price IDs Stripe. Pas de secret ici : ce sont des URLs publiques
   de paiement, pas des clés. */
const PAYMENT_LINKS = {
  decouverte: { url: 'https://buy.stripe.com/eVqcN4dKv7RO0FI4hsfMA00', price: 49, label: 'Découverte' },
  visibilite: { url: 'https://buy.stripe.com/bJe00ifSD8VS3RUg0afMA01', price: 99, label: 'Visibilité' },
  premium: { url: 'https://buy.stripe.com/dRm6oG49V1tq1JM29kfMA02', price: 190, label: 'Premium' },
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

async function stripeGet(path) {
  const r = await fetch(STRIPE + path, {
    headers: { Authorization: 'Bearer ' + process.env.STRIPE_SECRET_KEY },
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error('Stripe ' + r.status + ' ' + t.slice(0, 200));
  }
  return r.json();
}

/* Valide le JWT Supabase et vérifie que l'email est bien l'admin. */
async function isAdmin(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
  const token = authHeader.slice(7);
  try {
    const r = await fetch(process.env.SUPABASE_URL + '/auth/v1/user', {
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
        Authorization: 'Bearer ' + token,
      },
    });
    if (!r.ok) return false;
    const user = await r.json();
    return !!(user && user.email === 'contact@aircraft2sell.eu');
  } catch (e) { return false; }
}

function gabaritLienPaiement({ company, name, tierLabel, price, url }) {
  const salutation = name ? `Bonjour ${esc(name)},` : 'Bonjour,';
  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#EEF2F8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
<center style="width:100%;background:#EEF2F8;">
<div style="max-width:600px;margin:0 auto;text-align:left">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
       style="width:100%;background:#FFFFFF;border-radius:16px;border-collapse:separate;overflow:hidden">
<tr><td align="left" style="background:#FFFFFF;padding:24px 40px;border-bottom:1px solid #E4EAF2">
  <img src="${SITE}/logo.png?v=20260908" alt="Aircraft2Sell" width="160" height="26" style="display:block;width:160px;height:auto;border:0">
</td></tr>
<tr><td align="left" style="padding:40px 44px 8px">
 <h1 style="margin:0 0 20px;color:#0B2545;font-size:22px;font-weight:800;line-height:1.3">Votre lien de paiement partenaire</h1>
 <p style="margin:0 0 16px;color:#3D4F63;font-size:15px;line-height:1.6">${salutation}</p>
 <p style="margin:0 0 20px;color:#3D4F63;font-size:15px;line-height:1.6">
   Voici le lien de paiement pour votre partenariat Aircraft2Sell${company ? ` — <strong>${esc(company)}</strong>` : ''},
   palier <strong>${esc(tierLabel)}</strong> (${price} €/mois, sans engagement, résiliable à tout moment).
 </p>
 <table role="presentation" cellpadding="0" cellspacing="0"><tr>
   <td style="background:#EA6A16;border-radius:8px">
     <a href="${url}" style="display:inline-block;padding:13px 26px;color:#FFFFFF;font-size:15px;font-weight:700;text-decoration:none">Procéder au paiement</a>
   </td></tr></table>
 <p style="margin:20px 0 0;color:#8494A8;font-size:12px;line-height:1.6">
   Une question avant de régler ? Répondez simplement à cet email.
 </p>
</td></tr>
<tr><td style="padding:28px 44px 0"><hr style="border:none;border-top:1px solid #E4EAF2;margin:0"></td></tr>
<tr><td align="left" style="padding:24px 44px 32px">
  <p style="margin:0;color:#8494A8;font-size:12px;line-height:1.7">
    Aircraft2Sell — marketplace aéronautique européenne, zéro commission.<br>
    <a href="${SITE}" style="color:#1E5FCC;text-decoration:none">aircraft2sell.eu</a>
  </p>
</td></tr>
</table></div></center></body></html>`;
}

async function envoyerBrevo({ to, toName, sujet, html }) {
  const cle = process.env.BREVO_API_KEY;
  if (!cle) return { ok: false, erreur: 'BREVO_API_KEY absente' };
  const corps = {
    sender: { name: 'Aircraft2Sell', email: process.env.BREVO_FROM || 'contact@aircraft2sell.eu' },
    to: [{ email: to, name: toName || to }],
    subject: sujet,
    htmlContent: html,
  };
  try {
    const r = await fetch(BREVO, {
      method: 'POST',
      headers: { 'api-key': cle, 'Content-Type': 'application/json', accept: 'application/json' },
      body: JSON.stringify(corps),
    });
    const txt = await r.text();
    if (!r.ok) return { ok: false, erreur: `Brevo ${r.status} : ${txt.slice(0, 200)}` };
    let id = null;
    try { id = JSON.parse(txt).messageId; } catch { /* réponse vide acceptée */ }
    return { ok: true, id };
  } catch (e) {
    return { ok: false, erreur: e.message };
  }
}

async function resendPartnerLink(req, res) {
  const corps = req.body || {};
  const tier = String(corps.tier || '').trim().toLowerCase();
  const email = String(corps.email || '').trim().toLowerCase();
  const company = String(corps.company || '').trim();
  const name = String(corps.name || '').trim();

  const plan = PAYMENT_LINKS[tier];
  if (!plan) return res.status(400).json({ error: 'Palier inconnu (decouverte/visibilite/premium)' });
  if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'Email destinataire invalide' });

  const html = gabaritLienPaiement({ company, name, tierLabel: plan.label, price: plan.price, url: plan.url });
  const r = await envoyerBrevo({
    to: email,
    toName: name || company || email,
    sujet: `Lien de paiement — Partenariat ${plan.label} Aircraft2Sell`,
    html,
  });
  if (!r.ok) return res.status(502).json({ error: r.erreur });
  return res.status(200).json({ ok: true, id: r.id, url: plan.url });
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' }); return;
  }

  const ok = await isAdmin(req.headers.authorization);
  if (!ok) { res.status(401).json({ error: 'Non autorisé' }); return; }

  if (req.method === 'POST') {
    const action = String((req.body && req.body.action) || '').trim();
    if (action === 'resend-partner-link') return resendPartnerLink(req, res);
    return res.status(400).json({ error: 'Action inconnue' });
  }

  try {
    const [charges, customers, subs] = await Promise.all([
      stripeGet('/charges?limit=25'),
      stripeGet('/customers?limit=100'),
      stripeGet('/subscriptions?limit=100&status=all'),
    ]);

    const payments = charges.data.filter((p) => p.status === 'succeeded');
    const totalCents = payments.reduce((s, p) => s + p.amount, 0);
    const activeSubs = subs.data.filter((s) => s.status === 'active');
    const mrrCents = activeSubs.reduce((s, sub) => {
      const item = sub.items && sub.items.data && sub.items.data[0];
      return s + ((item && item.price && item.price.unit_amount) || 0);
    }, 0);

    res.json({
      live: (process.env.STRIPE_SECRET_KEY || '').startsWith('sk_live_'),
      total_revenue: { cents: totalCents, currency: (payments[0] && payments[0].currency) || 'eur' },
      customers_count: customers.data.length,
      subscriptions_count: subs.data.length,
      active_subscriptions: activeSubs.length,
      mrr: { cents: mrrCents, currency: 'eur' },
      payments: payments.map((p) => ({
        id: p.id,
        amount: { cents: p.amount, currency: p.currency },
        created: p.created,
        email: p.receipt_email || (p.billing_details && p.billing_details.email) || null,
        description: p.description || null,
      })),
      customers: customers.data.map((c) => ({
        id: c.id, email: c.email, name: c.name, created: c.created,
      })),
      subscriptions: subs.data.map((s) => ({
        id: s.id,
        status: s.status,
        email: (s.customer && typeof s.customer === 'object' && s.customer.email) || null,
        current_period_end: s.current_period_end,
        cancel_at_period_end: s.cancel_at_period_end,
        amount: {
          cents: (s.items && s.items.data && s.items.data[0] && s.items.data[0].price && s.items.data[0].price.unit_amount) || 0,
          currency: (s.items && s.items.data && s.items.data[0] && s.items.data[0].price && s.items.data[0].price.currency) || 'eur',
        },
      })),
    });
  } catch (e) {
    console.error('stripe-admin error:', e.message);
    res.status(500).json({ error: e.message });
  }
};
