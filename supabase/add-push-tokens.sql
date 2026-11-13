-- Phase 5 app mobile : notifications push (Expo Push Service)
-- Une ligne par appareil enregistré (un même user peut avoir plusieurs
-- téléphones) ; upsert sur (user_email, expo_push_token) depuis l'app.
create table if not exists public.push_tokens (
  id bigint generated always as identity primary key,
  user_email text not null,
  expo_push_token text not null unique,
  platform text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists push_tokens_user_email_idx on public.push_tokens (user_email);

-- Lecture/écriture publique restreinte : l'app écrit son propre token avec
-- la clé anon (utilisateur authentifié ou non, un visiteur anonyme avant
-- login peut déjà recevoir des alertes recherche). Jamais de lecture
-- publique des tokens d'autrui (uniquement service_role côté serveur
-- pour l'envoi push).
alter table public.push_tokens enable row level security;

drop policy if exists "push_tokens_insert_own" on public.push_tokens;
create policy "push_tokens_insert_own" on public.push_tokens
  for insert to anon, authenticated
  with check (true);

drop policy if exists "push_tokens_update_own" on public.push_tokens;
create policy "push_tokens_update_own" on public.push_tokens
  for update to anon, authenticated
  using (true);

-- Pas de policy SELECT pour anon/authenticated : seul service_role lit
-- (bypass RLS), ce qui empêche un visiteur de lister les tokens d'autrui.

revoke select on public.push_tokens from anon, authenticated;
