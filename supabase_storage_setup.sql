-- ============================================================
-- Aircraft2Sell — Supabase Storage Setup
-- Coller dans Supabase > SQL Editor > New Query > Run
-- ============================================================

-- Créer le bucket pour les photos d'annonces
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'listing-photos',
  'listing-photos', 
  true,
  10485760,  -- 10 MB max par photo
  array['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

-- Policy : lecture publique (pour afficher les photos sur le site)
create policy "listing_photos_public_read"
  on storage.objects for select
  using ( bucket_id = 'listing-photos' );

-- Policy : upload autorisé pour tous (anon key)
create policy "listing_photos_public_insert"
  on storage.objects for insert
  with check ( bucket_id = 'listing-photos' );

-- Policy : suppression autorisée
create policy "listing_photos_public_delete"
  on storage.objects for delete
  using ( bucket_id = 'listing-photos' );

-- Ajouter la colonne photos à la table listings (si pas déjà fait)
alter table public.listings 
  add column if not exists photos jsonb default '[]'::jsonb;
