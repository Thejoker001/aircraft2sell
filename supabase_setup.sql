-- ============================================================
-- Aircraft2Sell — Supabase Setup
-- Coller dans Supabase > SQL Editor > New Query > Run
-- ============================================================

-- TABLE LISTINGS (annonces)
create table if not exists public.listings (
  id            bigint primary key default extract(epoch from now())::bigint,
  make          text,
  model         text,
  year          text,
  price         text,
  currency      text default 'EUR',
  category      text,
  airport       text,
  country       text,
  description   text,
  status        text default 'pending',
  seller_name   text,
  seller_email  text,
  views         int default 0,
  enquiries     int default 0,
  icon          text default '✈',
  rejection_reason text,
  submitted_at  timestamptz default now(),
  created_at    timestamptz default now()
);

-- TABLE USERS (membres)
create table if not exists public.users (
  id            bigint primary key default extract(epoch from now())::bigint,
  name          text,
  email         text unique,
  plan          text default 'Essentiel',
  status        text default 'active',
  registered_at timestamptz default now(),
  created_at    timestamptz default now()
);

-- Activer Row Level Security
alter table public.listings enable row level security;
alter table public.users enable row level security;

-- Policies : lecture publique (pour le site), écriture via anon key
create policy "listings_select" on public.listings for select using (true);
create policy "listings_insert" on public.listings for insert with check (true);
create policy "listings_update" on public.listings for update using (true);
create policy "listings_delete" on public.listings for delete using (true);

create policy "users_select" on public.users for select using (true);
create policy "users_insert" on public.users for insert with check (true);
create policy "users_update" on public.users for update using (true);
create policy "users_delete" on public.users for delete using (true);

-- Index pour les recherches fréquentes
create index if not exists listings_status_idx on public.listings(status);
create index if not exists listings_seller_email_idx on public.listings(seller_email);
create index if not exists users_email_idx on public.users(email);
