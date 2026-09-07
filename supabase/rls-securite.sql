-- ═══════════════════════════════════════════════════════════════
-- Aircraft2Sell — cohérence de la certification + sécurisation
--
-- À APPLIQUER dans Supabase → SQL Editor.
-- Le fichier est en DEUX parties :
--   PARTIE 1 : sans risque, à appliquer maintenant.
--   PARTIE 2 : à n'appliquer qu'APRÈS migration des pages (voir en bas).
-- ═══════════════════════════════════════════════════════════════


-- ═══════════════════════════════════════════════════════════════
-- PARTIE 1 — COHÉRENCE DE LA CERTIFICATION (sans risque)
--
-- Problème : le site affiche le badge d'après listings.seller_certified,
-- alors que la certification est stockée dans users.certified. Rien ne
-- garantissait que les deux restent synchronisés : un vendeur certifié
-- après la publication de ses annonces gardait des annonces marquées
-- « non certifié », donc sans badge.
-- ═══════════════════════════════════════════════════════════════

-- Certifier un compte met à jour toutes ses annonces
create or replace function public.sync_seller_certified()
returns trigger
language plpgsql
security definer
as $$
begin
  if (new.certified is distinct from old.certified) then
    update public.listings
       set seller_certified = new.certified
     where lower(seller_email) = lower(new.email);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_sync_seller_certified on public.users;
create trigger trg_sync_seller_certified
  after update on public.users
  for each row execute function public.sync_seller_certified();

-- Une nouvelle annonce hérite de l'état du compte
create or replace function public.set_seller_certified_on_insert()
returns trigger
language plpgsql
security definer
as $$
declare
  v_cert boolean;
begin
  select certified into v_cert
    from public.users
   where lower(email) = lower(new.seller_email)
   limit 1;
  new.seller_certified := coalesce(v_cert, false);
  return new;
end;
$$;

drop trigger if exists trg_set_seller_certified on public.listings;
create trigger trg_set_seller_certified
  before insert on public.listings
  for each row execute function public.set_seller_certified_on_insert();

-- Rattrapage de l'existant (équivaut à scripts/sync-certified.mjs --apply)
update public.listings l
   set seller_certified = u.certified
  from public.users u
 where lower(l.seller_email) = lower(u.email)
   and l.seller_certified is distinct from u.certified;


-- ═══════════════════════════════════════════════════════════════
-- PARTIE 2 — FUITE DE DONNÉES PERSONNELLES
--
-- CONSTAT (vérifié en production) : la clé publique, lisible par tout
-- visiteur dans supabase.js, permet de lire la table users en entier.
--     curl "$SUPABASE_URL/rest/v1/users?select=*" -H "apikey: <clé publique>"
--     → nom, email, plan et statut de TOUS les membres.
-- C'est une violation RGPD (données personnelles en accès libre).
--
-- ATTENTION — NE PAS appliquer le bloc « VERROUILLAGE » tel quel.
-- supabase.js envoie TOUJOURS la clé publique, jamais le jeton de
-- l'utilisateur connecté :
--     'Authorization': 'Bearer ' + _SK
-- Toute politique réservée au rôle `authenticated` échouerait donc, et
-- ces pages cesseraient de fonctionner :
--     listing.html, en/listing.html, seller.html, dashboard.html,
--     post-listing.html, en/post-listing.html, login.html,
--     onboarding.html, diag.html
--
-- ORDRE D'OPÉRATIONS SÛR :
--   1. appliquer le bloc RPC ci-dessous (sans risque, additif) ;
--   2. migrer les pages publiques vers get_seller_public() ;
--   3. faire transmettre le jeton utilisateur par sbReq() pour les pages
--      qui lisent les données du membre connecté ;
--   4. seulement ensuite, appliquer le bloc VERROUILLAGE.
-- ═══════════════════════════════════════════════════════════════

-- ── Accès public au profil vendeur, sans exposer l'email ──
-- Fonction plutôt que vue : impossible d'énumérer les membres, il faut
-- déjà connaître l'email (présent sur l'annonce) pour obtenir la fiche.
create or replace function public.get_seller_public(p_email text)
returns table (
  name text,
  pseudo text,
  certified boolean,
  is_pro boolean,
  seller_type text,
  company text,
  rating numeric,
  plan text,
  registered_at timestamptz
)
language sql
security definer
stable
as $$
  select u.name, u.pseudo, u.certified, u.is_pro, u.seller_type,
         u.company, u.rating, u.plan, u.registered_at
    from public.users u
   where lower(u.email) = lower(trim(p_email))
     and u.status = 'active'
   limit 1;
$$;

grant execute on function public.get_seller_public(text) to anon, authenticated;

-- Agrégat déjà exposé, sans donnée personnelle (utilisé par l'accueil)
grant select on public.homepage_stats to anon, authenticated;


-- ═══════════════════════════════════════════════════════════════
-- VERROUILLAGE — à n'exécuter qu'après les étapes 1 à 3 ci-dessus
-- ═══════════════════════════════════════════════════════════════
--
-- alter table public.users enable row level security;
-- drop policy if exists "users_public_read" on public.users;
-- create policy "users_read_self"
--   on public.users for select to authenticated
--   using (lower(email) = lower(auth.jwt() ->> 'email'));
--
-- alter table public.listings enable row level security;
-- create policy "listings_read_live"
--   on public.listings for select to anon, authenticated
--   using (status = 'live');
-- create policy "listings_read_own"
--   on public.listings for select to authenticated
--   using (lower(seller_email) = lower(auth.jwt() ->> 'email'));
--
-- alter table public.messages enable row level security;
-- create policy "messages_read_own"
--   on public.messages for select to authenticated
--   using (lower(to_email) = lower(auth.jwt() ->> 'email')
--          or lower(from_email) = lower(auth.jwt() ->> 'email'));
--
-- -- Pièces d'identité : jamais publiques
-- alter table public.verification_requests enable row level security;
-- create policy "verification_read_own"
--   on public.verification_requests for select to authenticated
--   using (lower(email) = lower(auth.jwt() ->> 'email'));
--
-- VÉRIFICATION après verrouillage :
--   curl "$SUPABASE_URL/rest/v1/users?select=email" -H "apikey: <clé publique>"
--     → doit renvoyer []
--   curl "$SUPABASE_URL/rest/v1/rpc/get_seller_public" -H "apikey: <clé publique>" \
--        -H "Content-Type: application/json" -d '{"p_email":"vendeur@example.eu"}'
--     → doit continuer à renvoyer la fiche publique
