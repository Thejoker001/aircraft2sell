-- ============================================================
-- Aircraft2Sell — Migration localStorage → Supabase
-- Coller dans Supabase > SQL Editor > New Query > Run
-- ============================================================

-- ── MEMBRE ───────────────────────────────────────────────────
INSERT INTO public.users (id, name, email, plan, status, registered_at)
VALUES (
  1774190056641,
  'paulinetryoen',
  'paulinetryoen@gmail.com',
  'Essentiel',
  'active',
  '2026-03-22T14:34:16.641Z'
)
ON CONFLICT (email) DO UPDATE SET
  name   = EXCLUDED.name,
  plan   = EXCLUDED.plan,
  status = EXCLUDED.status;

-- ── ANNONCES ─────────────────────────────────────────────────

-- ATR 42-500 (déjà dans Supabase avec status=live, on met à jour)
INSERT INTO public.listings (id, make, model, year, price, currency, category, airport, description, status, seller_name, seller_email, views, enquiries, icon, submitted_at)
VALUES (
  1774226599058,
  'ATR', 'ATR 42-500', '2009', '123', 'EUR', 'light', 'LFPB',
  '123', 'live',
  'paulinetryoen', 'paulinetryoen@gmail.com',
  0, 0, '✈', '2026-03-23T00:43:19.057Z'
)
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status;

-- Aero Vodochody L-39 Albatros
INSERT INTO public.listings (id, make, model, year, price, currency, category, airport, description, status, seller_name, seller_email, views, enquiries, icon, submitted_at)
VALUES (
  1774226442502,
  'Aero Vodochody', 'L-39 Albatros', '2009', '123', 'EUR', 'light', 'LFPB',
  '12133', 'pending',
  'paulinetryoen', 'paulinetryoen@gmail.com',
  0, 0, '✈', '2026-03-23T00:40:42.502Z'
)
ON CONFLICT (id) DO NOTHING;

-- Aerion AS2
INSERT INTO public.listings (id, make, model, year, price, currency, category, airport, description, status, seller_name, seller_email, views, enquiries, icon, submitted_at)
VALUES (
  1774225682755,
  'Aerion', 'AS2', '2009', '123', 'EUR', 'jet', 'LFPB',
  '123', 'pending',
  'paulinetryoen', 'paulinetryoen@gmail.com',
  0, 0, '✈', '2026-03-23T00:28:02.755Z'
)
ON CONFLICT (id) DO NOTHING;

-- ── VÉRIFICATION ─────────────────────────────────────────────
SELECT 'listings' as table_name, count(*) as total FROM public.listings
UNION ALL
SELECT 'users', count(*) FROM public.users;
