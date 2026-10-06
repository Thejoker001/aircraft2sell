-- Clés API pour la gestion d'annonces par des systèmes tiers (sites de dealers/brokers).
--
-- CONTEXTE (2026-10-06) : un client pro (volume important) veut gérer ses annonces
-- Aircraft2Sell depuis son propre site via une API. On ne stocke JAMAIS la clé en
-- clair : seul son hash SHA-256 est en base. La clé n'est affichée au vendeur
-- qu'une seule fois, au moment de la génération (côté navigateur, dans dashboard.html).
--
-- Flux :
--  1. Le vendeur connecté génère une clé depuis son tableau de bord (onglet "API").
--     Le navigateur tire un aléa fort (crypto.getRandomValues), calcule son hash
--     SHA-256 (crypto.subtle.digest) et INSERT ce hash ici avec son propre JWT —
--     la RLS limite l'écriture à ses propres lignes, donc PAS besoin d'une nouvelle
--     fonction serverless pour la gestion des clés (même pattern que la table
--     partners : écriture directe via REST + RLS, zéro fonction Vercel ajoutée).
--  2. api/listings.js reçoit la clé en clair dans le header X-API-Key, la hash à
--     son tour et cherche la ligne correspondante (clé service_role : seule cette
--     fonction peut lire key_hash, jamais le navigateur). Si trouvée et non
--     révoquée, l'email du vendeur est extrait de CETTE ligne — jamais d'un champ
--     fourni par le client dans le corps de la requête.

create table if not exists public.api_keys (
  id            bigint generated always as identity primary key,
  seller_email  text not null,
  key_hash      text not null unique,     -- sha256 hex (64 car.) de la clé en clair
  label         text,                      -- nom libre donné par le vendeur ("Mon CRM")
  created_at    timestamptz not null default now(),
  last_used_at  timestamptz,
  revoked_at    timestamptz
);

create index if not exists api_keys_seller_email_idx on public.api_keys (lower(seller_email));
create index if not exists api_keys_key_hash_idx on public.api_keys (key_hash) where revoked_at is null;

-- Grants par défaut Supabase retirés puis policies explicites posées (même pattern
-- que supabase/create-partners.sql).
revoke insert, update, delete, truncate, references, trigger on public.api_keys from anon, authenticated;
revoke select on public.api_keys from anon, authenticated;

alter table public.api_keys enable row level security;

drop policy if exists api_keys_owner_all on public.api_keys;

-- Le vendeur connecté ne voit/gère QUE ses propres clés. Aucun accès anonyme :
-- la table n'a pas de policy pour le rôle "public"/anon.
create policy api_keys_owner_all on public.api_keys
  for all
  to authenticated
  using      (lower(auth.jwt()->>'email') = lower(seller_email))
  with check (lower(auth.jwt()->>'email') = lower(seller_email));

grant select, insert, update, delete on public.api_keys to authenticated;
