-- Table des partenariats publicitaires professionnels (aircraft2sell.eu/partenaires.html)
--
-- CONTEXTE (2026-09-23) : dispositif de pub native pour professionnels du secteur
-- (assurance, financement, maintenance, broker...). 3 paliers : decouverte / visibilite
-- / premium. Lecture publique restreinte aux lignes actives et dans leur fenêtre de
-- validité (même pattern que listings). Écriture réservée à l'admin uniquement.

create table if not exists public.partners (
  id bigint generated always as identity primary key,
  company text not null,
  logo_url text,
  website_url text not null,
  tagline text,                          -- courte accroche affichée sur la carte/l'encart
  category text not null default 'autre' -- assurance | financement | maintenance | broker | formation | autre
    check (category in ('assurance','financement','maintenance','broker','formation','autre')),
  tier text not null default 'decouverte'
    check (tier in ('decouverte','visibilite','premium')),
  status text not null default 'pending'
    check (status in ('pending','active','expired','rejected')),
  target_pages jsonb not null default '[]'::jsonb,  -- liste de pages ex: ["avions-legers.html"]
  contact_email text,
  contact_name text,
  starts_at timestamptz,
  ends_at timestamptz,
  notes text,                            -- notes internes admin (jamais exposées via select public)
  created_at timestamptz not null default now()
);

-- Grants par défaut Supabase (INSERT/UPDATE/DELETE/SELECT à anon+authenticated) :
-- on les retire immédiatement puis on pose des policies RLS explicites.
revoke insert, update, delete, truncate, references, trigger on public.partners from anon, authenticated;
revoke select on public.partners from anon, authenticated;

alter table public.partners enable row level security;

drop policy if exists partners_public_read on public.partners;
drop policy if exists partners_admin_all on public.partners;

-- Lecture publique : uniquement les colonnes nécessaires à l'affichage, uniquement
-- les lignes actives et dans leur fenêtre de validité. On n'expose jamais
-- contact_email/contact_name/notes via cette policy (colonnes filtrées côté GRANT).
create policy partners_public_read on public.partners
  for select
  using (
    status = 'active'
    and (starts_at is null or starts_at <= now())
    and (ends_at is null or ends_at >= now())
  );

grant select (id, company, logo_url, website_url, tagline, category, tier, target_pages)
  on public.partners to anon, authenticated;

-- Écriture : admin uniquement (même pattern que listings/users/messages).
create policy partners_admin_all on public.partners
  for all
  to authenticated
  using      (lower(auth.jwt()->>'email') = 'contact@aircraft2sell.eu')
  with check (lower(auth.jwt()->>'email') = 'contact@aircraft2sell.eu');

grant select, insert, update, delete on public.partners to authenticated;
