alter table public.meals
  add column photo_path text,
  add constraint meals_photo_path_length check (photo_path is null or char_length(photo_path) <= 180);

alter table public.exercises
  add column photo_path text,
  add constraint exercises_photo_path_length check (photo_path is null or char_length(photo_path) <= 180);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'plan-photos',
  'plan-photos',
  false,
  4194304,
  array['image/jpeg', 'image/png', 'image/webp']
);

create policy plan_photos_read on storage.objects
  for select to authenticated
  using (
    bucket_id = 'plan-photos'
    and (
      (select private.is_admin())
      or (storage.foldername(name))[1] = (select auth.uid())::text
    )
  );

create policy plan_photos_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'plan-photos'
    and (select private.is_admin())
  );

create policy plan_photos_update on storage.objects
  for update to authenticated
  using (bucket_id = 'plan-photos' and (select private.is_admin()))
  with check (bucket_id = 'plan-photos' and (select private.is_admin()));

create policy plan_photos_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'plan-photos' and (select private.is_admin()));

create or replace function public.copy_meal_day(p_client uuid, p_from smallint, p_to smallint)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if p_from = p_to then
    raise exception 'Elige otro día';
  end if;
  if p_from not between 1 and 7 or p_to not between 1 and 7 then
    raise exception 'Día no válido';
  end if;
  if not (select private.is_admin()) then
    raise exception 'No autorizado';
  end if;

  delete from public.meals
  where client_id = p_client
    and day_of_week = p_to;

  insert into public.meals (client_id, day_of_week, slot, title, detail, sort_order, photo_path)
  select client_id, p_to, slot, title, detail, sort_order, photo_path
  from public.meals
  where client_id = p_client
    and day_of_week = p_from;
end;
$$;

create or replace function public.copy_workout_day(p_client uuid, p_from smallint, p_to smallint)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  source_id uuid;
  new_day uuid;
begin
  if p_from = p_to then
    raise exception 'Elige otro día';
  end if;
  if p_from not between 1 and 7 or p_to not between 1 and 7 then
    raise exception 'Día no válido';
  end if;
  if not (select private.is_admin()) then
    raise exception 'No autorizado';
  end if;

  select id into source_id
  from public.workout_days
  where client_id = p_client
    and day_of_week = p_from;

  delete from public.workout_days
  where client_id = p_client
    and day_of_week = p_to;

  if source_id is null then
    return;
  end if;

  insert into public.workout_days (client_id, day_of_week, title, notes)
  select client_id, p_to, title, notes
  from public.workout_days
  where id = source_id
  returning id into new_day;

  insert into public.exercises (
    workout_day_id, name, sets, reps, weight_kg, rest_seconds, notes, sort_order, photo_path
  )
  select new_day, name, sets, reps, weight_kg, rest_seconds, notes, sort_order, photo_path
  from public.exercises
  where workout_day_id = source_id;
end;
$$;
