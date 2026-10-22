-- Protection anti-spam / rate-limiting pour les endpoints publics qui écrivent
-- en base et envoient des emails (api/contact-form.js, api/notify?type=message).
--
-- CONTEXTE (audit du 22/10) : aucune limitation de débit n'existait sur ces
-- routes. Risque identifié : spam/abus à mesure que le trafic grandit, et
-- épuisement du quota Brevo gratuit (300 emails/jour) par une rafale de
-- requêtes automatisées.
--
-- Conception : une seule table clé/valeur + une fonction atomique (upsert en
-- un seul statement SQL, verrouille la ligne, aucune race condition possible
-- même sous forte concurrence). Appelée depuis le code serverless via RPC
-- PostgREST avec la clé service_role (jamais exposée au navigateur).
--
-- Clé = "<endpoint>:<ip>" (ex. "contact-form:88.12.34.56"). Pas de RLS
-- publique : seule service_role (qui contourne la RLS) peut lire/écrire,
-- ce qui est correct puisque l'appel se fait uniquement côté serveur.

create table if not exists public.rate_limits (
  key text primary key,
  count integer not null default 1,
  window_start timestamptz not null default now()
);

alter table public.rate_limits enable row level security;
-- Aucune policy : anon/authenticated n'ont aucun accès (ni lecture ni
-- écriture). Seul service_role (BYPASSRLS) peut utiliser cette table,
-- via la fonction ci-dessous.

create or replace function public.check_rate_limit(
  p_key text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
as $$
declare
  v_count integer;
begin
  insert into public.rate_limits (key, count, window_start)
  values (p_key, 1, now())
  on conflict (key) do update
    set count = case
          when public.rate_limits.window_start < now() - (p_window_seconds || ' seconds')::interval
            then 1
          else public.rate_limits.count + 1
        end,
        window_start = case
          when public.rate_limits.window_start < now() - (p_window_seconds || ' seconds')::interval
            then now()
          else public.rate_limits.window_start
        end
  returning count into v_count;

  return v_count <= p_limit;
end;
$$;

-- Exécutée avec les droits du créateur (service_role), pas de l'appelant :
-- nécessaire car la table n'a aucune policy RLS permissive.
revoke all on function public.check_rate_limit(text, integer, integer) from public;
grant execute on function public.check_rate_limit(text, integer, integer) to service_role;

-- Entretien (optionnel, à lancer manuellement de temps en temps — la table
-- reste petite : au plus une ligne par IP distincte ayant déjà appelé un
-- endpoint protégé, pas par requête) :
--   delete from public.rate_limits where window_start < now() - interval '7 days';
