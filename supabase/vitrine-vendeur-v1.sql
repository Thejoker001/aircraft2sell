-- ═══════════════════════════════════════════════════════════════
-- Aircraft2Sell — Vitrine vendeur enrichie (12/11/26)
--
-- Ajoute à seller.html : photo/logo, bannière, lien site web, WhatsApp,
-- spécialités (tags), bio (déjà en base mais jamais exposée par les RPC
-- publiques — bug corrigé ici au passage) et nombre d'annonces vendues.
-- Aucune donnée personnelle nouvelle exposée (pas d'email/téléphone brut) :
-- website_url et whatsapp sont RENSEIGNÉS VOLONTAIREMENT par le vendeur
-- pour être publics (comme company/pseudo), à la différence de
-- seller_email/seller_phone qui restent interdits de sortie RPC.
-- ═══════════════════════════════════════════════════════════════

-- ── 1. Nouvelles colonnes sur users (profil vendeur) ──────────────
alter table public.users
  add column if not exists avatar_url   text,
  add column if not exists banner_url   text,
  add column if not exists website_url  text,
  add column if not exists whatsapp     text,
  add column if not exists specialties  text;

-- ── 2. get_seller_public(p_email) : drop+recreate (signature étendue) ──
drop function if exists public.get_seller_public(text);

create or replace function public.get_seller_public(p_email text)
returns table (
  name          text,
  pseudo        text,
  certified     boolean,
  is_pro        boolean,
  seller_type   text,
  company       text,
  rating        numeric,
  plan          text,
  registered_at timestamptz,
  founder       boolean,
  bio           text,
  avatar_url    text,
  banner_url    text,
  website_url   text,
  whatsapp      text,
  specialties   text,
  sold_count    bigint
)
language sql
security definer
stable
as $$
  select u.name, u.pseudo, u.certified, u.is_pro, u.seller_type,
         u.company, u.rating, u.plan, u.registered_at, u.founder, u.bio,
         u.avatar_url, u.banner_url, u.website_url, u.whatsapp, u.specialties,
         (select count(*) from public.listings l
           where lower(l.seller_email) = lower(trim(p_email))
             and l.status = 'sold') as sold_count
    from public.users u
   where lower(u.email) = lower(trim(p_email))
     and u.status = 'active'
   limit 1;
$$;

revoke all on function public.get_seller_public(text) from public;
grant execute on function public.get_seller_public(text) to anon, authenticated;

-- ── 3. get_seller_public_by_pseudo(p_pseudo) : drop+recreate ──────
drop function if exists public.get_seller_public_by_pseudo(text);

create or replace function public.get_seller_public_by_pseudo(p_pseudo text)
returns table (
  name          text,
  pseudo        text,
  certified     boolean,
  is_pro        boolean,
  seller_type   text,
  company       text,
  rating        numeric,
  plan          text,
  registered_at timestamptz,
  founder       boolean,
  bio           text,
  avatar_url    text,
  banner_url    text,
  website_url   text,
  whatsapp      text,
  specialties   text,
  sold_count    bigint
)
language sql
security definer
stable
as $$
  select u.name, u.pseudo, u.certified, u.is_pro, u.seller_type,
         u.company, u.rating, u.plan, u.registered_at, u.founder, u.bio,
         u.avatar_url, u.banner_url, u.website_url, u.whatsapp, u.specialties,
         (select count(*) from public.listings l
           where lower(l.seller_pseudo) = lower(trim(p_pseudo))
             and l.status = 'sold') as sold_count
    from public.users u
   where lower(u.pseudo) = lower(trim(p_pseudo))
     and u.status = 'active'
   limit 1;
$$;

grant execute on function public.get_seller_public_by_pseudo(text) to anon, authenticated;

-- Vérification (à exécuter séparément) :
-- select * from get_seller_public_by_pseudo('Arthur');
