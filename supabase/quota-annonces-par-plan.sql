-- Quota d'annonces actives par plan vendeur (déployé 2026-10-08, audit 2026-10-11)
--
-- PROBLÈME CORRIGÉ : le nombre d'annonces simultanées autorisées par plan
-- (Essentiel=1, Aviateur=3, Pro=illimité — cf. PLAN_SLOTS dans post-listing.html)
-- n'était vérifié QUE côté JavaScript client. Un appel direct à l'API Supabase
-- (devtools, script, app mobile qui ne reproduirait pas exactement la même
-- vérification) contournait totalement cette limite : testé en réel le
-- 2026-10-11, un compte Essentiel tout neuf a pu insérer 2 annonces sans
-- aucun blocage alors que son plan n'en autorise qu'une.
--
-- Ce trigger BEFORE INSERT sur listings compte les annonces actives
-- (status pending/live) du vendeur et REFUSE l'insertion si la limite de son
-- plan est déjà atteinte — s'applique à TOUT point d'insertion (site web +
-- app mobile Expo), ne peut pas être contourné côté client, comme
-- auto-validation-vendeurs-certifies.sql avant lui.
--
-- NE PAS compter l'annonce en cours d'insertion elle-même (NEW n'est pas
-- encore dans la table au moment du trigger BEFORE, donc le count ne la voit
-- pas — c'est le comportement voulu : on compte les annonces EXISTANTES avant
-- celle-ci).

create or replace function public.enforce_listing_quota_on_insert()
returns trigger
language plpgsql
security definer
as $$
declare
  v_plan    text;
  v_max     integer;
  v_active  integer;
begin
  select plan into v_plan
    from public.users
   where lower(email) = lower(new.seller_email)
   limit 1;

  v_max := case coalesce(v_plan, 'Essentiel')
             when 'Essentiel' then 1
             when 'Aviateur'  then 3
             when 'Pro'       then 999
             else 1
           end;

  select count(*) into v_active
    from public.listings
   where lower(seller_email) = lower(new.seller_email)
     and status in ('pending', 'live');

  if v_active >= v_max then
    raise exception 'quota_exceeded: plan % autorise % annonce(s) active(s) maximum (% déjà en pending/live)', coalesce(v_plan,'Essentiel'), v_max, v_active
      using errcode = '23514'; -- check_violation, mappé par PostgREST en 400 avec le message ci-dessus
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_listing_quota on public.listings;
create trigger trg_enforce_listing_quota
  before insert on public.listings
  for each row
  execute function public.enforce_listing_quota_on_insert();

-- Vérification après application :
--   select tgname, tgenabled from pg_trigger where tgrelid='public.listings'::regclass and not tgisinternal;
--   -> doit lister trg_enforce_listing_quota en plus de trg_log_price_change et trg_set_seller_certified.
