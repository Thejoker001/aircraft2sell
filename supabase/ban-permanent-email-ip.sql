-- ═══════════════════════════════════════════════════════════════
-- Aircraft2Sell — Bannissement permanent (email + IP)
--
-- OBJECTIF : un membre banni ne doit plus jamais pouvoir se réinscrire,
-- même en supprimant son compte et en recréant un compte avec le MÊME
-- email, ET on bloque les IP connues de ce membre à l'inscription.
--
-- Limite assumée (voir skill) : si l'utilisateur revient avec un email
-- ET une IP totalement différents (VPN/4G), rien ne peut l'en empêcher
-- techniquement sans KYC. Ce correctif ferme les deux vecteurs les plus
-- faciles (même email, même réseau).
--
-- APPLICATION : exécuté via Management API Supabase (service account),
-- 17/11/26.
-- ═══════════════════════════════════════════════════════════════

-- 1) Listes noires permanentes (indépendantes de la ligne public.users,
--    donc survivent à la suppression du compte banni).
create table if not exists public.banned_emails (
  email text primary key,
  banned_at timestamptz not null default now(),
  banned_by text,
  reason text
);

create table if not exists public.banned_ips (
  ip text primary key,
  banned_at timestamptz not null default now(),
  source_email text,
  reason text
);

-- 2) Journal des IP vues à l'inscription (alimenté par /api/register-guard),
--    pour retrouver les IP d'un membre au moment où on le bannit.
create table if not exists public.signup_ips (
  id bigserial primary key,
  email text not null,
  ip text not null,
  created_at timestamptz not null default now()
);
create index if not exists signup_ips_email_idx on public.signup_ips (lower(email));

alter table public.banned_emails enable row level security;
alter table public.banned_ips enable row level security;
alter table public.signup_ips enable row level security;
-- Aucune policy publique : accès uniquement via service_role (API admin / register-guard).

-- 3) Trigger sur auth.users : bloque la création de compte si l'email
--    (normalisé) est dans banned_emails. SECURITY DEFINER pour lire
--    public.banned_emails malgré RLS.
create or replace function public.block_banned_email_signup()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
begin
  if exists (
    select 1 from public.banned_emails
    where email = lower(trim(NEW.email))
  ) then
    raise exception 'Ce compte a été définitivement banni et ne peut pas être recréé. Contactez contact@aircraft2sell.eu si vous pensez qu''il s''agit d''une erreur.'
      using errcode = '23514';
  end if;
  return new;
end;
$function$;

drop trigger if exists block_banned_email_before_insert on auth.users;
create trigger block_banned_email_before_insert
  before insert on auth.users
  for each row execute function public.block_banned_email_signup();

-- 4) Fonctions RPC utilisées par register-guard.js (clé service_role) :
--    - is_signup_blocked(email, ip) -> bool
--    - log_signup_ip(email, ip)
create or replace function public.is_signup_blocked(p_email text, p_ip text)
returns boolean
language sql
security definer
set search_path = public
as $function$
  select exists(select 1 from public.banned_emails where email = lower(trim(p_email)))
      or (p_ip is not null and exists(select 1 from public.banned_ips where ip = p_ip));
$function$;

create or replace function public.log_signup_ip(p_email text, p_ip text)
returns void
language sql
security definer
set search_path = public
as $function$
  insert into public.signup_ips(email, ip) values (lower(trim(p_email)), p_ip);
$function$;

-- 5) Fonction appelée par l'admin au moment du bannissement : ajoute
--    l'email ET toutes les IP connues de ce membre aux listes noires.
create or replace function public.ban_identity_permanently(p_email text, p_by text default 'admin')
returns void
language plpgsql
security definer
set search_path = public
as $function$
begin
  insert into public.banned_emails(email, banned_by, reason)
  values (lower(trim(p_email)), p_by, 'Bannissement admin')
  on conflict (email) do nothing;

  insert into public.banned_ips(ip, source_email, reason)
  select distinct ip, lower(trim(p_email)), 'IP vue à l''inscription d''un compte banni'
  from public.signup_ips
  where lower(email) = lower(trim(p_email))
  on conflict (ip) do nothing;
end;
$function$;

-- 6) Fonction symétrique pour un débannissement explicite par l'admin
--    (retire des deux listes noires, restaure l'accès).
create or replace function public.unban_identity(p_email text)
returns void
language plpgsql
security definer
set search_path = public
as $function$
begin
  delete from public.banned_emails where email = lower(trim(p_email));
  delete from public.banned_ips where source_email = lower(trim(p_email));
end;
$function$;
