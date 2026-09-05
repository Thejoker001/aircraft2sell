-- ============================================================
-- Aircraft2Sell — Policies admin par email (sécurité renforcée)
-- Permet à l'admin connecté (contact@aircraft2sell.eu) de gérer les
-- tables admin via son JWT Supabase Auth, SANS clé service_role
-- exposée dans le front-end.
--
-- EXÉCUTION : Dashboard Supabase > SQL Editor > New query > Run
-- ============================================================

-- Helper: vrai si l'utilisateur connecté est l'admin du site
create or replace function public.is_admin()
returns boolean
language sql stable
security definer set search_path = public
as $$
  select coalesce(auth.jwt() ->> 'email', '') in
    ('contact@aircraft2sell.eu', 'contact.aircraft2sell@gmail.com');
$$;

-- ── ANALYTICS (lecture admin seulement) ──
drop policy if exists "analytics_admin_select_email" on public.analytics;
create policy "analytics_admin_select_email"
  on public.analytics for select
  using (public.is_admin() or auth.jwt()->>'role' = 'service_role');

-- ── LISTING_VIEWS (lecture admin seulement) ──
drop policy if exists "listing_views_admin_select_email" on public.listing_views;
create policy "listing_views_admin_select_email"
  on public.listing_views for select
  using (public.is_admin() or auth.jwt()->>'role' = 'service_role');

-- ── USERS (gestion complète par l'admin) ──
drop policy if exists "users_admin_all_email" on public.users;
create policy "users_admin_all_email"
  on public.users for all
  using (public.is_admin() or auth.jwt()->>'role' = 'service_role')
  with check (public.is_admin() or auth.jwt()->>'role' = 'service_role');

-- ── VERIFICATION_REQUESTS (si la table existe) ──
drop policy if exists "verif_admin_all_email" on public.verification_requests;
create policy "verif_admin_all_email"
  on public.verification_requests for all
  using (public.is_admin() or auth.jwt()->>'role' = 'service_role')
  with check (public.is_admin() or auth.jwt()->>'role' = 'service_role');

-- ── LISTINGS (gestion complète par l'admin : valider/rejeter/modérer) ──
drop policy if exists "listings_admin_all_email" on public.listings;
create policy "listings_admin_all_email"
  on public.listings for all
  using (public.is_admin() or auth.jwt()->>'role' = 'service_role')
  with check (public.is_admin() or auth.jwt()->>'role' = 'service_role');

-- NOTE : après exécution, régénérer la service_role key exposée dans le
-- dashboard (Project Settings > API > service_role key > Rotate/Régénérer).
