-- ═══════════════════════════════════════════════════════════════
-- Aircraft2Sell — SÉCURISATION DE LA BASE
--
-- ⚠️  À APPLIQUER EN PRIORITÉ. Ce n'est pas qu'une fuite de données :
--     la base est ouverte en ÉCRITURE à n'importe quel visiteur.
--
-- CONSTAT VÉRIFIÉ EN PRODUCTION (08/09/2026)
--   scripts/audit-ecriture.py
--
--   table                    lire       modifier   supprimer
--   users                    9 lignes   OUI        OUI
--   listings                 6 lignes   OUI        OUI
--   messages                 verrouillé OUI        OUI
--   verification_requests    verrouillé non        OUI
--   analytics                676 lignes non        OUI
--   listing_views            9 lignes   non        OUI
--
--   La clé publique est lisible par tous dans supabase.js. Une seule
--   requête suffit à vider une table :
--       curl -X DELETE ".../rest/v1/listings?id=gt.0" -H "apikey: <clé>"
--
--   Démontré : un PATCH anonyme a modifié le plan d'un compte réel
--   (restauré depuis). Rien n'empêche la destruction totale des données.
--
-- CE QUE CE FICHIER CORRIGE
--   1. Fuite : la liste des membres (nom, email, formule) n'est plus lisible.
--   2. Écriture : plus aucune modification ni suppression anonyme.
--   3. Les fonctionnalités du site sont préservées (compatibilité vérifiée,
--      voir la section en fin de fichier).
--
-- APPLICATION : Supabase → SQL Editor → coller tout le fichier → Run.
-- ═══════════════════════════════════════════════════════════════


-- ═══════════════════════════════════════════════════════════════
-- 1. SUPPRESSION DES POLITIQUES PERMISSIVES PRÉEXISTANTES
--
-- La base contenait des politiques en rôle `public` qui autorisaient TOUT
-- le monde — même sans connexion — à lire, modifier et supprimer. Elles
-- primaient sur toute politique restrictive que l'on peut ajouter.
-- Ces noms doivent être supprimés explicitement : ils ne figurent pas dans
-- les listes plus bas.
-- ═══════════════════════════════════════════════════════════════

drop policy if exists "listings_delete" on public.listings;
drop policy if exists "listings_insert" on public.listings;
drop policy if exists "listings_read"   on public.listings;
drop policy if exists "listings_update" on public.listings;
drop policy if exists "messages_read"   on public.messages;
drop policy if exists "messages_update" on public.messages;
drop policy if exists "admin_all"      on public.users;
drop policy if exists "users_delete"   on public.users;
drop policy if exists "users_insert"   on public.users;
drop policy if exists "users_read"     on public.users;
drop policy if exists "users_update"   on public.users;
drop policy if exists "verif_read"     on public.verification_requests;


-- ═══════════════════════════════════════════════════════════════
-- 2. PROFIL VENDEUR PUBLIC (sans email)
-- Le site l'utilise déjà : il faut la créer AVANT de verrouiller users.
-- ═══════════════════════════════════════════════════════════════

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

revoke all on function public.get_seller_public(text) from public;
grant execute on function public.get_seller_public(text) to anon, authenticated;


-- ═══════════════════════════════════════════════════════════════
-- 2. USERS — fuite + écriture
-- ═══════════════════════════════════════════════════════════════

alter table public.users enable row level security;

drop policy if exists "users_public_read"               on public.users;
drop policy if exists "Enable read access for all users" on public.users;
drop policy if exists "users_select_anon"               on public.users;
drop policy if exists "users_anon_write"                on public.users;
drop policy if exists "users_read_self"                 on public.users;
drop policy if exists "users_update_self"               on public.users;
drop policy if exists "users_insert_signup"             on public.users;

-- Lecture : sa propre fiche uniquement
create policy "users_read_self"
  on public.users for select
  to authenticated
  using (lower(email) = lower(auth.jwt() ->> 'email'));

-- Modification : sa propre fiche uniquement
create policy "users_update_self"
  on public.users for update
  to authenticated
  using      (lower(email) = lower(auth.jwt() ->> 'email'))
  with check (lower(email) = lower(auth.jwt() ->> 'email'));

-- Inscription : autorisée, mais uniquement pour sa propre adresse
create policy "users_insert_signup"
  on public.users for insert
  to authenticated
  with check (lower(email) = lower(auth.jwt() ->> 'email'));

-- Aucune suppression par le front : le back-office (service_role) contourne
-- la RLS et reste seul habilité.


-- ═══════════════════════════════════════════════════════════════
-- 3. LISTINGS — modification et suppression anonymes
-- ═══════════════════════════════════════════════════════════════

alter table public.listings enable row level security;

drop policy if exists "listings_public_read"  on public.listings;
drop policy if exists "listings_anon_write"   on public.listings;
drop policy if exists "listings_read_live"    on public.listings;
drop policy if exists "listings_read_own"     on public.listings;
drop policy if exists "listings_insert_own"   on public.listings;
drop policy if exists "listings_update_own"   on public.listings;
drop policy if exists "listings_delete_own"   on public.listings;

-- Lecture publique : uniquement les annonces publiées
create policy "listings_read_live"
  on public.listings for select
  to anon, authenticated
  using (status = 'live');

-- Un vendeur voit toutes ses annonces, quel que soit leur statut
create policy "listings_read_own"
  on public.listings for select
  to authenticated
  using (lower(seller_email) = lower(auth.jwt() ->> 'email'));

-- Dépôt d'annonce : pour soi-même, en attente de modération
create policy "listings_insert_own"
  on public.listings for insert
  to authenticated
  with check (lower(seller_email) = lower(auth.jwt() ->> 'email'));

-- Modification et suppression : ses propres annonces
create policy "listings_update_own"
  on public.listings for update
  to authenticated
  using      (lower(seller_email) = lower(auth.jwt() ->> 'email'))
  with check (lower(seller_email) = lower(auth.jwt() ->> 'email'));

create policy "listings_delete_own"
  on public.listings for delete
  to authenticated
  using (lower(seller_email) = lower(auth.jwt() ->> 'email'));


-- ═══════════════════════════════════════════════════════════════
-- 4. MESSAGES — modification et suppression anonymes
-- La lecture est déjà correctement restreinte : on n'y touche pas.
-- ═══════════════════════════════════════════════════════════════

alter table public.messages enable row level security;

drop policy if exists "messages_anon_write"   on public.messages;
drop policy if exists "messages_update_own"   on public.messages;
drop policy if exists "messages_delete_own"   on public.messages;
drop policy if exists "messages_insert_public" on public.messages;

-- Envoi : un acheteur non connecté doit pouvoir écrire au vendeur depuis
-- une annonce. On borne le contenu pour limiter les abus.
create policy "messages_insert_public"
  on public.messages for insert
  to anon, authenticated
  with check (
    sender_email   is not null
    and receiver_email is not null
    and content is not null
    and length(content) between 1 and 5000
  );

-- Marquage « lu » : par le destinataire seulement
create policy "messages_update_own"
  on public.messages for update
  to authenticated
  using      (lower(receiver_email) = lower(auth.jwt() ->> 'email'))
  with check (lower(receiver_email) = lower(auth.jwt() ->> 'email'));

-- Suppression : par les participants à la conversation
create policy "messages_delete_own"
  on public.messages for delete
  to authenticated
  using (
    lower(receiver_email) = lower(auth.jwt() ->> 'email')
    or lower(sender_email) = lower(auth.jwt() ->> 'email')
  );


-- ═══════════════════════════════════════════════════════════════
-- 5. VERIFICATION_REQUESTS — suppression anonyme
-- Contient des numéros de pièces d'identité.
-- ═══════════════════════════════════════════════════════════════

alter table public.verification_requests enable row level security;

drop policy if exists "verif_anon_write"    on public.verification_requests;
drop policy if exists "verif_insert_own"    on public.verification_requests;
drop policy if exists "verif_read_own"      on public.verification_requests;

create policy "verif_read_own"
  on public.verification_requests for select
  to authenticated
  using (lower(email) = lower(auth.jwt() ->> 'email'));

create policy "verif_insert_own"
  on public.verification_requests for insert
  to authenticated
  with check (lower(email) = lower(auth.jwt() ->> 'email'));

-- Ni modification ni suppression par le front : seule la modération
-- (service_role) traite ces demandes.


-- ═══════════════════════════════════════════════════════════════
-- 6. ANALYTICS et LISTING_VIEWS — suppression anonyme
-- Le site doit pouvoir écrire (compteurs de vues), jamais effacer.
-- ═══════════════════════════════════════════════════════════════

alter table public.analytics enable row level security;
drop policy if exists "analytics_anon_write"  on public.analytics;
drop policy if exists "analytics_insert_any"  on public.analytics;

create policy "analytics_insert_any"
  on public.analytics for insert
  to anon, authenticated
  with check (true);

alter table public.listing_views enable row level security;
drop policy if exists "views_anon_write"  on public.listing_views;
drop policy if exists "views_insert_any"  on public.listing_views;
drop policy if exists "views_read_any"    on public.listing_views;

create policy "views_insert_any"
  on public.listing_views for insert
  to anon, authenticated
  with check (true);

-- Le compteur de vues d'une annonce reste public
create policy "views_read_any"
  on public.listing_views for select
  to anon, authenticated
  using (true);


-- ═══════════════════════════════════════════════════════════════
-- COMPATIBILITÉ VÉRIFIÉE AVANT APPLICATION
--
--   login.html (inscription)   INSERT avec le jeton + return=minimal
--                              -> users_insert_signup, pas de relecture.
--   onboarding.html            PATCH avec le jeton -> users_update_self.
--   post-listing.html          SELECT plan avec le jeton -> users_read_self ;
--                              INSERT annonce -> listings_insert_own.
--   dashboard.html             jeton présent partout.
--   diag.html                  jeton admin transmis.
--   seller.html                get_seller_public().
--   listing.html, en/listing.html   get_seller_public() ; le formulaire de
--                              contact écrit dans messages -> insert_public.
--   messages.html              lecture/écriture avec le jeton de session.
--   index.html, search.html    lisent listings (status = 'live').
--   admin, modération          service_role : contourne la RLS.
--
-- Contrôles automatisés :
--   python3 scripts/test-fuite-users.py     (compatibilité du code)
--   python3 scripts/audit-ecriture.py       (doit passer à « non » partout)
--   python3 scripts/audit-fuite.py          (users doit passer « verrouillé »)
--   node scripts/test-features.mjs          (24 tests fonctionnels)
--
-- ATTENTION : après application, une inscription exige d'être authentifié
-- (le compte Auth est créé avant la ligne `users` — c'est déjà l'ordre suivi
-- par login.html, qui envoie d.access_token). Vérifier une inscription
-- réelle juste après le déploiement.
-- ═══════════════════════════════════════════════════════════════
