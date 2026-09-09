/**
 * api/stripe-admin.js — Données Stripe réelles pour le panneau admin
 *
 * La clé secrète Stripe vit UNIQUEMENT côté serveur (env Vercel
 * STRIPE_SECRET_KEY) — jamais exposée au navigateur. L'accès est
 * restreint au compte admin (JWT Supabase + email contact@).
 *
 *   GET /api/stripe-admin
 *   Authorization: Bearer <JWT admin Supabase>
 *   -> { live, total_revenue, currency, customers_count, mrr, payments[], ... }
 */
const STRIPE = 'https://api.stripe.com/v1';

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
        apikey: process.env.SUPABASE_ANON_KEY || '',
        Authorization: 'Bearer ' + token,
      },
    });
    if (!r.ok) return false;
    const user = await r.json();
    return !!(user && user.email === 'contact@aircraft2sell.eu');
  } catch (e) { return false; }
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (req.method !== 'GET') { res.status(405).json({ error: 'Method not allowed' }); return; }

  const ok = await isAdmin(req.headers.authorization);
  if (!ok) { res.status(401).json({ error: 'Non autorisé' }); return; }

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
