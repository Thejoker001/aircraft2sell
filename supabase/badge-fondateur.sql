-- ═══════════════════════════════════════════════════════════════
-- Aircraft2Sell — Badge "Membre Fondateur"
--
-- Colonne manuelle (booléenne) sur users, activée au cas par cas
-- depuis l'onglet Membres de l'admin (checkbox mu-founder). C'est
-- une pure reconnaissance, indépendante de is_free/plan/certified —
-- aucun lien avec le quota, le MRR ou le badge "vendeur certifié".
--
-- Exposée par get_seller_public()/get_seller_public_by_pseudo() pour
-- l'afficher sur le profil public (seller.html), même pattern RGPD
-- que les colonnes existantes : jamais l'email en sortie, toujours
-- filtré sur u.status = 'active'. Colonnes préservées à l'identique
-- (vérifiées en direct en base avant écriture de ce fichier) + founder
-- ajoutée en dernière position.
-- ═══════════════════════════════════════════════════════════════

alter table public.users add column if not exists founder boolean not null default false;

-- CREATE OR REPLACE ne peut pas changer le type de retour d'une fonction
-- existante (colonne ajoutée) : DROP explicite requis avant recréation.
-- Sans risque ici, tout le fichier s'exécute dans une seule transaction.
drop function if exists public.get_seller_public(text);
drop function if exists public.get_seller_public_by_pseudo(text);

create or replace function public.get_seller_public(p_email text)
returns table(name text, pseudo text, certified boolean, is_pro boolean,
              seller_type text, company text, rating numeric, plan text,
              registered_at timestamptz, founder boolean)
language sql
stable
security definer
as $$
  select u.name, u.pseudo, u.certified, u.is_pro, u.seller_type,
         u.company, u.rating, u.plan, u.registered_at, u.founder
    from public.users u
   where lower(u.email) = lower(trim(p_email))
     and u.status = 'active'
   limit 1;
$$;

grant execute on function public.get_seller_public(text) to anon, authenticated;

create or replace function public.get_seller_public_by_pseudo(p_pseudo text)
returns table(name text, pseudo text, certified boolean, is_pro boolean,
              seller_type text, company text, rating numeric, plan text,
              registered_at timestamptz, founder boolean)
language sql
stable
security definer
as $$
  select u.name, u.pseudo, u.certified, u.is_pro, u.seller_type,
         u.company, u.rating, u.plan, u.registered_at, u.founder
    from public.users u
   where lower(u.pseudo) = lower(trim(p_pseudo))
     and u.status = 'active'
   limit 1;
$$;

grant execute on function public.get_seller_public_by_pseudo(text) to anon, authenticated;

-- Vérification (à exécuter séparément) :
-- select founder from public.users limit 1;
-- select * from get_seller_public_by_pseudo('AirborneSolutions');
