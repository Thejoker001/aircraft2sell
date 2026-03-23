-- ============================================================
-- Aircraft2Sell — Analytics Setup
-- Coller dans Supabase > SQL Editor > New Query > Run
-- ============================================================

-- TABLE ANALYTICS (visites de pages)
create table if not exists public.analytics (
  id            bigserial primary key,
  page          text,
  referrer      text,
  country       text,
  device        text,
  browser       text,
  listing_id    bigint,
  session_id    text,
  created_at    timestamptz default now()
);

-- TABLE LISTING_VIEWS (vues détaillées par annonce)
-- La colonne views existe déjà dans listings, cette table garde l'historique
create table if not exists public.listing_views (
  id            bigserial primary key,
  listing_id    bigint,
  country       text,
  session_id    text,
  created_at    timestamptz default now()
);

-- RLS : écriture publique (tracker), lecture admin seulement via anon key
alter table public.analytics enable row level security;
alter table public.listing_views enable row level security;

create policy "analytics_insert" on public.analytics for insert with check (true);
create policy "analytics_select" on public.analytics for select using (true);
create policy "listing_views_insert" on public.listing_views for insert with check (true);
create policy "listing_views_select" on public.listing_views for select using (true);

-- Index pour les requêtes fréquentes
create index if not exists analytics_created_idx on public.analytics(created_at desc);
create index if not exists analytics_page_idx on public.analytics(page);
create index if not exists analytics_country_idx on public.analytics(country);
create index if not exists listing_views_lid_idx on public.listing_views(listing_id);
create index if not exists listing_views_created_idx on public.listing_views(created_at desc);
