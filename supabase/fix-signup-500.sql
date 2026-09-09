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
-- CORRECTIF (v1, 09/09) : conversion UUID -> bigint déterministe et robuste,
--   en prenant les 8 premiers octets de l'UUID (jamais de cast texte).
--
-- CORRECTIF (v2, 09/09 — RÉGRESSION trouvée le même jour) : les 8 premiers
--   octets (64 bits) dépassent 2^53-1 = 9007199254740991 (MAX_SAFE_INTEGER
--   de JavaScript). Exemple réel : id 7667274840646729527 -> arrondi en JS
--   à 7667274840646730000 -> PATCH id=eq.<arrondi> = 0 ligne -> l'admin
--   affichait « aucune ligne modifiée » sur les profils des NOUVEAUX
--   inscrits. On passe à 6 octets (48 bits, max 2^48-1) : unique, stable,
--   et toujours sous la limite JS.
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
  -- UUID -> bigint déterministe SOUS 2^53-1 : 6 premiers octets (48 bits).
  -- 8 octets dépassaient MAX_SAFE_INTEGER et cassaient la précision
  -- JavaScript côté admin (PATCH id=eq.<arrondi> -> 0 ligne).
  v_id := ('x' || substr(replace(NEW.id::text, '-', ''), 1, 12))::bit(48)::bigint;
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
