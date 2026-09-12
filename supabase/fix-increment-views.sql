-- Fonction RPC pour incrémenter le compteur de vues d'une annonce.
--
-- CONTEXTE (bug diagnostiqué 2026-09-12) : listing.html appelait déjà
-- POST /rest/v1/rpc/increment_views mais cette fonction n'a jamais existé
-- en base (404 PGRST202). Le repli PATCH direct sur listings échouait aussi
-- en silence à cause de la RLS post-08/09 (seul le propriétaire authentifié
-- peut modifier sa propre annonce) : le compteur "views" restait bloqué à 0
-- pour toutes les annonces, sans aucune erreur visible côté navigateur.
--
-- SECURITY DEFINER permet à un visiteur anonyme d'incrémenter UNIQUEMENT le
-- compteur de vues (rien d'autre) sans avoir besoin d'une policy RLS globale
-- d'écriture sur listings, qui rouvrirait la faille corrigée le 08/09.
create or replace function public.increment_views(listing_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.listings
     set views = coalesce(views, 0) + 1
   where id = listing_id;
end;
$$;

grant execute on function public.increment_views(bigint) to anon, authenticated;
