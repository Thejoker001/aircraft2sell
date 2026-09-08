-- ═══════════════════════════════════════════════════════════════
-- Aircraft2Sell — FUITE DE DONNÉES PERSONNELLES : correctif
--
-- CONSTAT VÉRIFIÉ EN PRODUCTION (08/09/2026)
--   curl "$SUPABASE_URL/rest/v1/users?select=email,name,plan" \
--        -H "apikey: <clé publique>"
--   → renvoie les 9 membres : nom, email, formule d'abonnement.
--
-- La clé publique est lisible par n'importe qui dans supabase.js. La liste
-- complète des membres est donc téléchargeable en une requête. C'est une
-- violation du RGPD (art. 5.1.f et 32 : confidentialité, sécurité).
--
-- Les autres tables sont déjà correctement verrouillées :
--   listings, messages, verification_requests → 0 ligne pour anon.
--
-- ORDRE D'APPLICATION (les deux blocs, dans cet ordre, en une seule fois) :
--   1. créer la fonction get_seller_public  (le site en a besoin)
--   2. verrouiller la table users
-- Le code du site est DÉJÀ déployé pour utiliser cette fonction : il
-- fonctionne avant comme après, avec un repli automatique.
-- ═══════════════════════════════════════════════════════════════


-- ── 1. Profil vendeur public, SANS email ──────────────────────────
-- Fonction (et non vue) : impossible d'énumérer les membres. Il faut déjà
-- connaître l'email — qui figure sur l'annonce — pour obtenir la fiche.
-- L'email n'est jamais renvoyé.

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


-- ── 2. Verrouillage de la table users ─────────────────────────────
alter table public.users enable row level security;

-- Supprime toute politique de lecture publique existante
drop policy if exists "users_public_read"              on public.users;
drop policy if exists "Enable read access for all users" on public.users;
drop policy if exists "users_select_anon"              on public.users;

-- Un membre connecté lit sa propre fiche (dashboard, paramètres)
drop policy if exists "users_read_self" on public.users;
create policy "users_read_self"
  on public.users for select
  to authenticated
  using (lower(email) = lower(auth.jwt() ->> 'email'));

-- Un membre connecté modifie sa propre fiche
drop policy if exists "users_update_self" on public.users;
create policy "users_update_self"
  on public.users for update
  to authenticated
  using      (lower(email) = lower(auth.jwt() ->> 'email'))
  with check (lower(email) = lower(auth.jwt() ->> 'email'));

-- L'inscription doit rester possible sans être connecté
drop policy if exists "users_insert_signup" on public.users;
create policy "users_insert_signup"
  on public.users for insert
  to anon, authenticated
  with check (email is not null and length(email) between 3 and 320);

-- Aucune lecture anonyme : le site passe par get_seller_public().
-- La clé service_role (back-office) contourne la RLS : rien à changer.


-- ── 3. VÉRIFICATION (à exécuter après application) ────────────────
-- Doit renvoyer [] :
--   curl "$SUPABASE_URL/rest/v1/users?select=email" -H "apikey: <clé publique>"
--
-- Doit renvoyer la fiche publique, sans email :
--   curl -X POST "$SUPABASE_URL/rest/v1/rpc/get_seller_public" \
--     -H "apikey: <clé publique>" -H "Content-Type: application/json" \
--     -d '{"p_email":"sales@genevajet-demo.eu"}'
--
-- Ou, plus simplement :  python3 scripts/audit-fuite.py
--   users doit passer de « 9 lignes / DONNEES PERSONNELLES » à « verrouillé ».
