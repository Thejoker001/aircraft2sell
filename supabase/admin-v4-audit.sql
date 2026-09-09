-- ═══════════════════════════════════════════════════════════════
-- Aircraft2Sell — ADMIN v4 : journal d'audit + dernière connexion
-- ───────────────────────────────────────────────────────────────
-- 1. Table admin_logs : trace chaque action admin (qui, quoi, quand).
-- 2. Colonne users.last_login_at : affichée dans l'admin (suggestion 10).
-- 3. Colonne users.banned : statut banni (suggestion 8) — on garde le
--    statut 'banned' dans la colonne status existante, PAS une colonne
--    dédiée, pour ne pas dupliquer la source de vérité.
--
-- APPLICATION : Supabase → SQL Editor → coller → Run (ou via API).
-- ═══════════════════════════════════════════════════════════════

-- 1. Journal d'audit
create table if not exists public.admin_logs (
  id          bigint generated always as identity primary key,
  admin_email text not null,
  action      text not null,          -- ex. 'listing.approve', 'user.update', 'user.ban'
  target_type text,                   -- 'listing' | 'user' | 'message' | ...
  target_id   text,
  details     jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists admin_logs_created_idx on public.admin_logs (created_at desc);
create index if not exists admin_logs_admin_idx  on public.admin_logs (admin_email);

-- 2. Dernière connexion (nullable — pas de valeur pour les comptes anciens)
alter table public.users add column if not exists last_login_at timestamptz;

-- RLS : les logs sont LISIBLES/ÉCRIVABLES uniquement par l'admin (JWT).
alter table public.admin_logs enable row level security;
drop policy if exists admin_logs_admin_all on public.admin_logs;
create policy admin_logs_admin_all on public.admin_logs
  for all to authenticated
  using (lower((auth.jwt() ->> 'email')::text) = 'contact@aircraft2sell.eu')
  with check (lower((auth.jwt() ->> 'email')::text) = 'contact@aircraft2sell.eu');
