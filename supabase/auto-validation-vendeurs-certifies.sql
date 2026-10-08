-- ═══════════════════════════════════════════════════════════════
-- Aircraft2Sell — Auto-validation des annonces des vendeurs certifiés
-- Créé 2026-10-08, demande Romain.
--
-- Comportement :
--   - Si le compte vendeur (public.users, email = listings.seller_email)
--     a certified = true ET status = 'active' au moment de l'INSERT,
--     l'annonce part directement en status='live' (publication instantanée).
--   - Sinon (non certifié, ou certifié mais compte suspendu/banni),
--     comportement inchangé : status='pending', modération manuelle.
--   - L'email admin "nouvelle annonce" (api/notify?type=new-listing,
--     appelé côté client après l'INSERT) continue de partir dans tous
--     les cas : rien à changer côté JS, pas de condition sur le statut.
--
-- Remplace/étend le trigger existant trg_set_seller_certified posé par
-- supabase/rls-securite.sql (qui ne faisait que copier seller_certified).
-- ═══════════════════════════════════════════════════════════════

create or replace function public.set_seller_certified_on_insert()
returns trigger
language plpgsql
security definer
as $$
declare
  v_cert   boolean;
  v_status text;
begin
  select certified, status into v_cert, v_status
    from public.users
   where lower(email) = lower(new.seller_email)
   limit 1;

  new.seller_certified := coalesce(v_cert, false);

  -- Auto-validation : vendeur certifié ET compte actif (pas suspendu/banni).
  -- On ne touche au status que si l'appelant l'a laissé à sa valeur par
  -- défaut 'pending' côté client (post-listing.html envoie toujours
  -- status:'pending') — un admin qui insérerait explicitement un autre
  -- statut via l'admin panel n'est pas écrasé.
  if coalesce(v_cert, false) = true
     and coalesce(v_status, '') = 'active'
     and new.status = 'pending' then
    new.status := 'live';
  end if;

  return new;
end;
$$;

-- Le trigger existant (BEFORE INSERT) pointe déjà vers cette fonction,
-- pas besoin de le recréer — on a juste remplacé le corps de la fonction.
-- Vérification :
--   select tgname, tgrelid::regclass from pg_trigger
--    where tgname = 'trg_set_seller_certified';
