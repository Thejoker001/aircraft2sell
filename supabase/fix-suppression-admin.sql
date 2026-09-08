-- ═══════════════════════════════════════════════════════════════
-- Aircraft2Sell — CORRECTIF : suppression/modification impossible
-- depuis l'espace admin (admin-a2s00760.html)
--
-- CAUSE : securite-base.sql (08/09/2026) a bien fermé les écritures
-- anonymes sur listings/users, mais les policies *_update_own /
-- *_delete_own ne couvrent que le PROPRIÉTAIRE (seller_email = son
-- propre email). L'admin (contact@aircraft2sell.eu) n'est vendeur
-- d'aucune annonce : ses suppressions/modifications sont refusées
-- silencieusement par la RLS (0 ligne affectée, pas d'erreur).
-- La clé service_role a été retirée à raison du navigateur (elle ne
-- doit jamais être exposée côté client) — la solution correcte est
-- une policy RLS dédiée basée sur le JWT Supabase Auth de l'admin
-- (infalsifiable), pas de réintroduire la clé service_role au front.
--
-- APPLICATION : Supabase → SQL Editor → coller → Run.
-- ═══════════════════════════════════════════════════════════════

-- ── LISTINGS : admin peut tout lire/modifier/supprimer ──
drop policy if exists "listings_admin_all" on public.listings;
create policy "listings_admin_all"
  on public.listings for all
  to authenticated
  using      (lower(auth.jwt() ->> 'email') = 'contact@aircraft2sell.eu')
  with check (lower(auth.jwt() ->> 'email') = 'contact@aircraft2sell.eu');

-- ── USERS : admin peut tout lire/modifier/supprimer ──
drop policy if exists "users_admin_all" on public.users;
create policy "users_admin_all"
  on public.users for all
  to authenticated
  using      (lower(auth.jwt() ->> 'email') = 'contact@aircraft2sell.eu')
  with check (lower(auth.jwt() ->> 'email') = 'contact@aircraft2sell.eu');

-- ── MESSAGES : admin peut tout lire/modifier/supprimer (modération) ──
drop policy if exists "messages_admin_all" on public.messages;
create policy "messages_admin_all"
  on public.messages for all
  to authenticated
  using      (lower(auth.jwt() ->> 'email') = 'contact@aircraft2sell.eu')
  with check (lower(auth.jwt() ->> 'email') = 'contact@aircraft2sell.eu');

-- ── VERIFICATION_REQUESTS : admin peut tout traiter ──
drop policy if exists "verif_admin_all" on public.verification_requests;
create policy "verif_admin_all"
  on public.verification_requests for all
  to authenticated
  using      (lower(auth.jwt() ->> 'email') = 'contact@aircraft2sell.eu')
  with check (lower(auth.jwt() ->> 'email') = 'contact@aircraft2sell.eu');

-- ── ANALYTICS / LISTING_VIEWS : admin peut purger si besoin ──
drop policy if exists "analytics_admin_all" on public.analytics;
create policy "analytics_admin_all"
  on public.analytics for all
  to authenticated
  using      (lower(auth.jwt() ->> 'email') = 'contact@aircraft2sell.eu')
  with check (lower(auth.jwt() ->> 'email') = 'contact@aircraft2sell.eu');

drop policy if exists "views_admin_all" on public.listing_views;
create policy "views_admin_all"
  on public.listing_views for all
  to authenticated
  using      (lower(auth.jwt() ->> 'email') = 'contact@aircraft2sell.eu')
  with check (lower(auth.jwt() ->> 'email') = 'contact@aircraft2sell.eu');

-- NOTE : si un jour plusieurs comptes admin existent, remplacer la
-- comparaison par une table dédiée public.admins(email) ou un claim
-- personnalisé plutôt qu'un email en dur ici ET dans admin-a2s00760.html.
