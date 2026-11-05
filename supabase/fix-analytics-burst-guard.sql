-- Garde-fou anti-trafic automatise sur analytics/listing_views (2026-11-05)
--
-- Contexte : le filtre cote navigateur (navigator.webdriver + regex UA bots)
-- ne detecte pas un Chrome automatise "stealth" qui masque ces signaux.
-- Analyse statistique du 2026-11-05 : 1285 hits sur 8587 (15%) presentaient
-- une signature de trafic automatise fiable -- >=3 session_id DISTINCTS
-- arrivant dans une fenetre de 2 secondes. Sous l'hypothese de visiteurs
-- humains independants (loi de Poisson sur le volume reel de trafic/jour),
-- la probabilite d'observer ne serait-ce qu'UN SEUL de ces evenements par
-- hasard est quasi nulle -- on en a observe 141. Supprime et decremente
-- (voir ~/workspace/nettoyage-analytics-2026-11-05/).
--
-- Ce correctif bloque CE motif precis a la source, cote serveur, independamment
-- de tout fingerprint navigateur (donc resistant a un futur contournement du
-- filtre JS cote client).

create or replace function public.reject_burst_hit()
returns trigger
language plpgsql
security definer
as $$
declare
  cnt int;
begin
  select count(distinct session_id) into cnt
  from public.analytics
  where created_at >= clock_timestamp() - interval '2 seconds'
    and session_id <> new.session_id;
  if cnt >= 2 then
    raise exception 'burst_rejected: trafic automatise detecte (>=3 sessions distinctes en 2s)';
  end if;
  return new;
end;
$$;

drop trigger if exists analytics_burst_guard on public.analytics;
create trigger analytics_burst_guard
  before insert on public.analytics
  for each row execute function public.reject_burst_hit();

create or replace function public.reject_burst_hit_listing_views()
returns trigger
language plpgsql
security definer
as $$
declare
  cnt int;
begin
  select count(distinct session_id) into cnt
  from public.listing_views
  where created_at >= clock_timestamp() - interval '2 seconds'
    and session_id <> new.session_id;
  if cnt >= 2 then
    raise exception 'burst_rejected: trafic automatise detecte (>=3 sessions distinctes en 2s)';
  end if;
  return new;
end;
$$;

drop trigger if exists listing_views_burst_guard on public.listing_views;
create trigger listing_views_burst_guard
  before insert on public.listing_views
  for each row execute function public.reject_burst_hit_listing_views();

notify pgrst, 'reload schema';
