-- ═══════════════════════════════════════════════════════════════
-- Aircraft2Sell — AUDIT V2 : durcissement RLS + nouvelles fonctions
-- ───────────────────────────────────────────────────────────────
-- 1. Durcissement : plus de CHECK:true sur les INSERT anonymes.
-- 2. Table reports : signalement d'annonces (A3/D1).
-- 3. Table testimonials : avis post-transaction (C4).
-- 4. Colonnes listings : featured_until (B4), expires_at (B3).
--
-- APPLICATION : Supabase → SQL Editor → coller → Run (ou via API).
-- ═══════════════════════════════════════════════════════════════

-- ═══ 1. DURCISSEMENT RLS ═══

-- 1a. analytics : l'INSERT anon reste nécessaire (tracking) mais avec
--     validation minimale (anti-spam) : session_id obligatoire et court.
drop policy if exists analytics_insert on public.analytics;
drop policy if exists analytics_insert_any on public.analytics;
create policy analytics_insert on public.analytics
  for insert to anon, authenticated
  with check (
    session_id is not null
    and length(session_id) <= 64
    and length(coalesce(page, '')) <= 200
    and length(coalesce(device, '')) <= 20
    and length(coalesce(country, '')) <= 40
  );

-- 1b. listing_views : INSERT validé (listing_id requis), SELECT restreint.
drop policy if exists views_insert_any on public.listing_views;
drop policy if exists listing_views_insert on public.listing_views;
drop policy if exists views_read_any on public.listing_views;
create policy views_insert_any on public.listing_views
  for insert to anon, authenticated
  with check (
    listing_id is not null
    and length(coalesce(session_id, '')) <= 64
  );
create policy views_read_any on public.listing_views
  for select to authenticated
  using (true);

-- 1c. verification_requests : INSERT validé (email + type de document).
drop policy if exists verif_insert on public.verification_requests;
create policy verif_insert on public.verification_requests
  for insert to anon, authenticated
  with check (
    email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    and coalesce(doc_type, '') in ('passport', 'id_card', 'pilot_license')
    and length(coalesce(doc_number, '')) <= 50
    and length(coalesce(doc_country, '')) <= 40
  );

-- 1d. messages : supprimer la policy dupliquée trop permissive
--     (messages_insert_public a déjà la validation longueur 1-5000).
drop policy if exists messages_insert on public.messages;

-- ═══ 2. TABLE REPORTS (signalements) ═══

create table if not exists public.reports (
  id             bigint generated always as identity primary key,
  listing_id     bigint not null,
  reporter_email text not null,
  reason         text not null,
  details        text,
  status         text not null default 'pending',
  created_at     timestamptz not null default now()
);
create index if not exists reports_status_idx on public.reports (status, created_at desc);

alter table public.reports enable row level security;
drop policy if exists reports_insert_public on public.reports;
create policy reports_insert_public on public.reports
  for insert to anon, authenticated
  with check (
    listing_id is not null
    and length(reason) between 3 and 200
    and reporter_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  );
drop policy if exists reports_admin_all on public.reports;
create policy reports_admin_all on public.reports
  for all to authenticated
  using (lower((auth.jwt() ->> 'email')::text) = 'contact@aircraft2sell.eu')
  with check (lower((auth.jwt() ->> 'email')::text) = 'contact@aircraft2sell.eu');

-- ═══ 3. TABLE TESTIMONIALS (avis post-transaction) ═══

create table if not exists public.testimonials (
  id           bigint generated always as identity primary key,
  listing_id   bigint,
  seller_email text not null,
  author_name  text not null,
  author_email text,
  rating       integer not null check (rating between 1 and 5),
  comment      text,
  status       text not null default 'pending',
  created_at   timestamptz not null default now()
);
create index if not exists testimonials_seller_idx on public.testimonials (seller_email, status);

alter table public.testimonials enable row level security;
drop policy if exists testimonials_insert on public.testimonials;
create policy testimonials_insert on public.testimonials
  for insert to authenticated
  with check (
    rating between 1 and 5
    and length(author_name) between 2 and 100
    and length(coalesce(comment, '')) <= 1000
  );
drop policy if exists testimonials_read_live on public.testimonials;
create policy testimonials_read_live on public.testimonials
  for select to anon, authenticated
  using (status = 'live');
drop policy if exists testimonials_admin_all on public.testimonials;
create policy testimonials_admin_all on public.testimonials
  for all to authenticated
  using (lower((auth.jwt() ->> 'email')::text) = 'contact@aircraft2sell.eu')
  with check (lower((auth.jwt() ->> 'email')::text) = 'contact@aircraft2sell.eu');

-- ═══ 4. COLONNES LISTINGS ═══

alter table public.listings add column if not exists featured_until timestamptz;
alter table public.listings add column if not exists expires_at timestamptz;
