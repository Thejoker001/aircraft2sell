-- supabase/social-tokens.sql
-- Table de stockage des tokens OAuth des réseaux sociaux (LinkedIn Company Page
-- pour l'instant, extensible à d'autres providers). Accès service_role UNIQUEMENT
-- (aucune policy anon/authenticated) : cette table ne doit JAMAIS être lisible
-- depuis le navigateur, elle n'est consultée que par les fonctions Vercel api/.

create table if not exists public.social_tokens (
  provider text primary key,          -- ex. 'linkedin'
  access_token text not null,
  refresh_token text,
  expires_at timestamptz,             -- expiration de l'access_token
  refresh_expires_at timestamptz,     -- expiration du refresh_token (LinkedIn : 1 an)
  org_urn text,                       -- ex. urn:li:organization:12345678 (Company Page)
  org_name text,                      -- nom affiché, pour vérification humaine rapide
  scope text,                         -- scopes accordés lors du consentement
  updated_at timestamptz not null default now()
);

alter table public.social_tokens enable row level security;

-- Aucune policy créée : RLS activée + 0 policy = 0 accès pour anon/authenticated.
-- Seul service_role (BYPASSRLS) peut lire/écrire cette table — utilisé uniquement
-- par les fonctions Vercel (jamais exposé au navigateur).

-- Retirer les GRANT par défaut Supabase (cf. piège documenté dans le skill
-- aircraft2sell-site : chaque CREATE TABLE hérite par défaut de droits pour
-- anon/authenticated).
revoke all on public.social_tokens from anon, authenticated;
