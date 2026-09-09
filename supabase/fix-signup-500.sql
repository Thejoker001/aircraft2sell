-- ═══════════════════════════════════════════════════════════════
-- Aircraft2Sell — CORRECTIF : inscription impossible (500 Supabase Auth)
--
-- CONSTAT (vérifié 2026-09-09 en production) : /auth/v1/signup renvoyait
-- 500 « Database error saving new user » pour TOUT nouvel email. Le login
-- des comptes existants, lui, fonctionnait.
--
-- CAUSE RACINE (prouvée par test SQL direct) :
--   public.users.id est un bigint. Le trigger on_auth_user_created appelait
--   handle_new_user(), qui insérait NEW.id::text::bigint où NEW.id est
--   l'UUID de auth.users. Le cast uuid -> bigint échoue systématiquement
--   (erreur 22P02, testé avec l'UUID réel de l'admin) :
--       '41fc84db-ea07-4d4d-930b-3486f5069591'::text::bigint  ->  ERREUR
--   Résultat : auth.users créait bien le compte, mais le trigger échouait
--   à créer le profil dans public.users, annulant tout l'INSERT -> 500.
--   Le trigger était pourtant déjà SECURITY DEFINER : le problème n'était
--   pas la RLS, c'était le cast impossible.
--
-- CORRECTIF : conversion UUID -> bigint déterministe et robuste, en
--   prenant les 8 premiers octets de l'UUID (jamais de cast texte).
--   La même valeur est reproductible pour un même compte, et reste un
--   bigint positif stable pour la table users.
--
-- APPLICATION : Supabase → SQL Editor → coller → Run.
-- ═══════════════════════════════════════════════════════════════

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_id bigint;
begin
  -- UUID -> bigint déterministe : 8 premiers octets, valeur positive.
  v_id := ('x' || substr(replace(NEW.id::text, '-', ''), 1, 16))::bit(64)::bigint;
  if v_id < 0 then
    v_id := v_id * -1;
  end if;

  insert into public.users (id, email, name, plan, status, registered_at)
  values (
    v_id,
    NEW.email,
    coalesce(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'Essentiel',
    'active',
    NEW.created_at
  )
  on conflict (email) do nothing;

  return new;
end;
$function$;
