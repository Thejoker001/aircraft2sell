-- ============================================================
-- Aircraft2Sell — Supabase RLS SÉCURISÉES v2
-- Remplace supabase_setup.sql
-- ============================================================

-- Supprimer les anciennes policies trop permissives
drop policy if exists "listings_select" on public.listings;
drop policy if exists "listings_insert" on public.listings;
drop policy if exists "listings_update" on public.listings;
drop policy if exists "listings_delete" on public.listings;
drop policy if exists "users_select" on public.users;
drop policy if exists "users_insert" on public.users;
drop policy if exists "users_update" on public.users;
drop policy if exists "users_delete" on public.users;

-- ── LISTINGS ──

-- Lecture : live pour tout le monde, pending/rejected seulement owner ou admin
create policy "listings_public_read" on public.listings for select
using (
  status = 'live'
  or seller_email = auth.jwt()->>'email'
  or auth.jwt()->>'role' = 'service_role'
);

-- Création : authentifié + email correspond
create policy "listings_authenticated_insert" on public.listings for insert
with check (
  auth.uid() is not null
  and seller_email = auth.jwt()->>'email'
);

-- Modification : owner ou admin seulement
create policy "listings_owner_update" on public.listings for update
using (
  seller_email = auth.jwt()->>'email'
  or auth.jwt()->>'role' = 'service_role'
);

-- Suppression : owner ou admin seulement
create policy "listings_owner_delete" on public.listings for delete
using (
  seller_email = auth.jwt()->>'email'
  or auth.jwt()->>'role' = 'service_role'
);

-- ── USERS ──

-- Lecture : soi-même ou admin
create policy "users_self_read" on public.users for select
using (
  email = auth.jwt()->>'email'
  or auth.jwt()->>'role' = 'service_role'
);

-- Création : authentifié + email correspond
create policy "users_self_insert" on public.users for insert
with check (
  auth.uid() is not null
  and email = auth.jwt()->>'email'
);

-- Modification : soi-même ou admin
create policy "users_self_update" on public.users for update
using (
  email = auth.jwt()->>'email'
  or auth.jwt()->>'role' = 'service_role'
);

-- Suppression : admin seulement
create policy "users_admin_delete" on public.users for delete
using (auth.jwt()->>'role' = 'service_role');

-- ── ANALYTICS (écriture publique, lecture admin seulement) ──
drop policy if exists "analytics_insert" on public.analytics;
drop policy if exists "analytics_select" on public.analytics;
drop policy if exists "listing_views_insert" on public.listing_views;
drop policy if exists "listing_views_select" on public.listing_views;

create policy "analytics_public_insert" on public.analytics for insert with check (true);
create policy "analytics_admin_select" on public.analytics for select using (auth.jwt()->>'role' = 'service_role');
create policy "listing_views_public_insert" on public.listing_views for insert with check (true);
create policy "listing_views_admin_select" on public.listing_views for select using (auth.jwt()->>'role' = 'service_role');
