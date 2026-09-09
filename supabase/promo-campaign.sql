-- ═══════════════════════════════════════════════════════════════
-- Aircraft2Sell — Offre "Pro offert à vie" liée à la campagne de
-- prospection mondiale (2026-09-08)
--
-- But : compter et attribuer les places de façon ATOMIQUE (jamais plus de
-- 5 grants, même avec des inscriptions simultanées) — indépendant de la
-- table `users` pour ne jamais entrer en collision avec des comptes déjà
-- marqués `is_free=true` pour d'autres raisons (ex: compte admin).
--
-- APPLICATION : Supabase → SQL Editor → coller tout le fichier → Run.
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.promo_campaign_grants (
  id          bigserial primary key,
  email       text not null unique,
  campaign    text not null default 'pro5-prospection-2026-09',
  rank        int  not null,
  created_at  timestamptz not null default now()
);

-- Aucun accès direct anon/authenticated : uniquement service_role (via
-- l'API Vercel) et la fonction SECURITY DEFINER ci-dessous.
alter table public.promo_campaign_grants enable row level security;
revoke all on public.promo_campaign_grants from anon, authenticated;

-- Fonction atomique : tente d'attribuer une place de la campagne à l'email
-- donné. Retourne le rang (1..5) si accordé, ou NULL si l'offre est déjà
-- complète OU si cet email a déjà une place (dans ce cas, retourne son
-- rang existant — idempotent, un double appel ne casse rien).
create or replace function public.grant_promo_campaign(
  p_email    text,
  p_campaign text default 'pro5-prospection-2026-09',
  p_total    int  default 5
)
returns table(rang int, deja_accorde boolean, complet boolean)
language plpgsql
security definer
as $$
declare
  v_email text := lower(trim(p_email));
  v_existing int;
  v_count int;
  v_new_rank int;
begin
  -- Déjà accordé à cet email : renvoyer son rang existant, aucune écriture.
  select rank into v_existing
    from public.promo_campaign_grants
   where email = v_email;
  if v_existing is not null then
    return query select v_existing, true, false;
    return;
  end if;

  -- Verrou consultatif sur la campagne : sérialise les tentatives
  -- concurrentes pour ce lot précis, sans bloquer les autres campagnes.
  perform pg_advisory_xact_lock(hashtext(p_campaign));

  select count(*) into v_count from public.promo_campaign_grants where campaign = p_campaign;
  if v_count >= p_total then
    return query select null::int, false, true;
    return;
  end if;

  v_new_rank := v_count + 1;
  insert into public.promo_campaign_grants(email, campaign, rank)
    values (v_email, p_campaign, v_new_rank);

  return query select v_new_rank, false, false;
end;
$$;

revoke all on function public.grant_promo_campaign(text, text, int) from public;
-- Appelée uniquement depuis les fonctions serverless Vercel (service_role).

-- ═══════════════════════════════════════════════════════════════
-- Vérification après application :
--   select * from public.promo_campaign_grants;   -- doit être vide au départ
--   select public.grant_promo_campaign('test@example.com');  -- rang 1
--   select public.grant_promo_campaign('test@example.com');  -- deja_accorde=true, meme rang
-- ═══════════════════════════════════════════════════════════════
