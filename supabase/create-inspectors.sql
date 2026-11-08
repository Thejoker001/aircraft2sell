-- Annuaire d'inspecteurs pré-achat (aircraft2sell.eu/inspecteurs.html)
--
-- CONTEXTE (2026-11-08) : panneau admin "Annuaire" permettant de publier des
-- contacts d'inspecteurs/mécaniciens agréés indépendants sur la page publique
-- inspecteurs.html (FR/EN/ET). Même pattern que public.partners : lecture
-- publique restreinte aux lignes actives, écriture réservée à l'admin.

create table if not exists public.inspectors (
  id bigint generated always as identity primary key,
  name text not null,                    -- nom / société de l'inspecteur
  email text not null,
  phone text,
  country text not null,                 -- pays / zone d'intervention affichée
  qualifications text,                   -- ex. "Mécanicien agréé Part-66, expert EASA"
  bio text,                              -- description publique courte (catégories couvertes, tarifs indicatifs...)
  website_url text,
  status text not null default 'pending'
    check (status in ('pending','active','rejected')),
  notes text,                            -- notes internes admin (jamais exposées via select public)
  created_at timestamptz not null default now()
);

-- Grants par défaut Supabase (INSERT/UPDATE/DELETE/SELECT à anon+authenticated) :
-- on les retire immédiatement puis on pose des policies RLS explicites.
revoke insert, update, delete, truncate, references, trigger on public.inspectors from anon, authenticated;
revoke select on public.inspectors from anon, authenticated;

alter table public.inspectors enable row level security;

drop policy if exists inspectors_public_read on public.inspectors;
drop policy if exists inspectors_admin_all on public.inspectors;

-- Lecture publique : uniquement les inspecteurs actifs (validés par l'admin).
-- email/phone sont volontairement exposés ici (annuaire de contacts), mais
-- jamais notes (internes).
create policy inspectors_public_read on public.inspectors
  for select
  using (status = 'active');

grant select (id, name, email, phone, country, qualifications, bio, website_url)
  on public.inspectors to anon, authenticated;

-- Écriture : admin uniquement (même pattern que partners/listings/users).
create policy inspectors_admin_all on public.inspectors
  for all
  to authenticated
  using      (lower(auth.jwt()->>'email') = 'contact@aircraft2sell.eu')
  with check (lower(auth.jwt()->>'email') = 'contact@aircraft2sell.eu');

grant select, insert, update, delete on public.inspectors to authenticated;
