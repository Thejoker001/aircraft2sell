-- Policies RLS pour le bucket Storage "photos" (annonces).
-- Le bucket est public (lecture) mais l'écriture nécessite un utilisateur authentifié.
-- Cohérent avec le pattern déjà en place pour le bucket "instagram-stories".

drop policy if exists "photos_public_read" on storage.objects;
create policy "photos_public_read"
  on storage.objects for select
  to public
  using (bucket_id = 'photos');

drop policy if exists "photos_authenticated_insert" on storage.objects;
create policy "photos_authenticated_insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'photos');

drop policy if exists "photos_authenticated_update" on storage.objects;
create policy "photos_authenticated_update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'photos')
  with check (bucket_id = 'photos');

drop policy if exists "photos_authenticated_delete" on storage.objects;
create policy "photos_authenticated_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'photos');
