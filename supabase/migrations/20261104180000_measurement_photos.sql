create or replace function private.measurement_photo_paths_ok(client_id uuid, paths text[])
returns boolean
language sql
immutable
set search_path = ''
as $$
  select coalesce(cardinality(paths), 0) <= 3
    and not exists (
      select 1
      from unnest(paths) as path
      where path is null
        or char_length(path) > 180
        or split_part(path, '/', 1) is distinct from client_id::text
        or path !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/measurements/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[1-3]\.(jpg|png|webp)$'
    );
$$;

revoke all on function private.measurement_photo_paths_ok(uuid, text[]) from public, anon, authenticated;

alter table public.body_measurements
  add column photo_paths text[] not null default '{}',
  add constraint body_measurements_photo_paths_ok
    check (private.measurement_photo_paths_ok(client_id, photo_paths));

create policy plan_photos_measurement_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'plan-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and (storage.foldername(name))[2] = 'measurements'
  );

create policy plan_photos_measurement_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'plan-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and (storage.foldername(name))[2] = 'measurements'
  )
  with check (
    bucket_id = 'plan-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and (storage.foldername(name))[2] = 'measurements'
  );

create policy plan_photos_measurement_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'plan-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and (storage.foldername(name))[2] = 'measurements'
  );
