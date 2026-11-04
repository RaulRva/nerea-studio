-- Nerea Studio: perfiles, ficha corporal, dieta semanal y entrenos.
-- El rol de autorización vive en profiles.role. No se lee de user_metadata.

create schema if not exists private;

revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  full_name text not null default '',
  role text not null default 'client' check (role in ('admin', 'client')),
  created_at timestamptz not null default now(),
  constraint profiles_full_name_length check (char_length(full_name) <= 80)
);

create table public.body_measurements (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles (id) on delete cascade,
  weight_kg numeric(5, 2) not null,
  height_cm numeric(5, 1) not null,
  chest_cm numeric(5, 1) not null,
  arm_cm numeric(5, 1) not null,
  waist_cm numeric(5, 1) not null,
  hip_cm numeric(5, 1) not null,
  thigh_cm numeric(5, 1) not null,
  recorded_at timestamptz not null default now(),
  constraint body_weight_range check (weight_kg between 25 and 300),
  constraint body_height_range check (height_cm between 100 and 250),
  constraint body_chest_range check (chest_cm between 20 and 200),
  constraint body_arm_range check (arm_cm between 10 and 80),
  constraint body_waist_range check (waist_cm between 30 and 200),
  constraint body_hip_range check (hip_cm between 30 and 200),
  constraint body_thigh_range check (thigh_cm between 15 and 120)
);

create index body_measurements_client_recorded_idx
  on public.body_measurements (client_id, recorded_at desc);

create table public.meals (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles (id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 1 and 7),
  slot text not null check (slot in ('desayuno', 'almuerzo', 'comida', 'merienda', 'cena')),
  title text not null,
  detail text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint meals_title_length check (char_length(title) between 1 and 120),
  constraint meals_detail_length check (char_length(detail) <= 2000)
);

create index meals_client_day_idx
  on public.meals (client_id, day_of_week, slot, sort_order);

create table public.workout_days (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles (id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 1 and 7),
  title text not null default '',
  notes text not null default '',
  unique (client_id, day_of_week),
  constraint workout_title_length check (char_length(title) <= 120),
  constraint workout_notes_length check (char_length(notes) <= 2000)
);

create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  workout_day_id uuid not null references public.workout_days (id) on delete cascade,
  name text not null,
  sets smallint,
  reps text not null default '',
  weight_kg numeric(6, 2),
  rest_seconds integer,
  notes text not null default '',
  sort_order integer not null default 0,
  constraint exercises_name_length check (char_length(name) between 1 and 120),
  constraint exercises_sets_range check (sets is null or sets between 1 and 30),
  constraint exercises_reps_length check (char_length(reps) <= 40),
  constraint exercises_weight_range check (weight_kg is null or weight_kg between 0 and 500),
  constraint exercises_rest_range check (rest_seconds is null or rest_seconds between 0 and 900),
  constraint exercises_notes_length check (char_length(notes) <= 500)
);

create index exercises_day_order_idx
  on public.exercises (workout_day_id, sort_order);

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'admin'
  );
$$;

revoke all on function private.is_admin() from public, anon;
grant execute on function private.is_admin() to authenticated;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    lower(new.email),
    left(btrim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), 80),
    'client'
  );
  return new;
end;
$$;

revoke all on function private.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

create or replace function private.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.id is distinct from old.id then
    raise exception 'No puedes cambiar el id';
  end if;

  if new.role is distinct from old.role
     and (select auth.uid()) is not null
     and not (select private.is_admin()) then
    raise exception 'No puedes cambiar el rol';
  end if;

  if new.email is distinct from old.email
     and (select auth.uid()) is not null
     and not (select private.is_admin()) then
    raise exception 'No puedes cambiar el correo';
  end if;

  return new;
end;
$$;

revoke all on function private.protect_profile_role() from public, anon, authenticated;

create trigger profiles_protect_role
  before update on public.profiles
  for each row execute function private.protect_profile_role();

alter table public.profiles enable row level security;
alter table public.body_measurements enable row level security;
alter table public.meals enable row level security;
alter table public.workout_days enable row level security;
alter table public.exercises enable row level security;

create policy profiles_select on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or (select private.is_admin()));

create policy profiles_update on public.profiles
  for update to authenticated
  using (id = (select auth.uid()) or (select private.is_admin()))
  with check (id = (select auth.uid()) or (select private.is_admin()));

create policy measurements_select on public.body_measurements
  for select to authenticated
  using (client_id = (select auth.uid()) or (select private.is_admin()));

create policy measurements_insert on public.body_measurements
  for insert to authenticated
  with check (client_id = (select auth.uid()) or (select private.is_admin()));

create policy measurements_delete on public.body_measurements
  for delete to authenticated
  using (client_id = (select auth.uid()) or (select private.is_admin()));

create policy meals_select on public.meals
  for select to authenticated
  using (client_id = (select auth.uid()) or (select private.is_admin()));

create policy meals_write on public.meals
  for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy workout_days_select on public.workout_days
  for select to authenticated
  using (client_id = (select auth.uid()) or (select private.is_admin()));

create policy workout_days_write on public.workout_days
  for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy exercises_select on public.exercises
  for select to authenticated
  using (
    (select private.is_admin())
    or exists (
      select 1
      from public.workout_days day
      where day.id = workout_day_id
        and day.client_id = (select auth.uid())
    )
  );

create policy exercises_write on public.exercises
  for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

revoke all on table public.profiles from anon, authenticated, public;
revoke all on table public.body_measurements from anon, authenticated, public;
revoke all on table public.meals from anon, authenticated, public;
revoke all on table public.workout_days from anon, authenticated, public;
revoke all on table public.exercises from anon, authenticated, public;

grant select, update on table public.profiles to authenticated;
grant select, insert, delete on table public.body_measurements to authenticated;
grant select, insert, update, delete on table public.meals to authenticated;
grant select, insert, update, delete on table public.workout_days to authenticated;
grant select, insert, update, delete on table public.exercises to authenticated;

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

  insert into public.meals (client_id, day_of_week, slot, title, detail, sort_order)
  select client_id, p_to, slot, title, detail, sort_order
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
    workout_day_id, name, sets, reps, weight_kg, rest_seconds, notes, sort_order
  )
  select new_day, name, sets, reps, weight_kg, rest_seconds, notes, sort_order
  from public.exercises
  where workout_day_id = source_id;
end;
$$;

revoke all on function public.copy_meal_day(uuid, smallint, smallint) from public, anon;
revoke all on function public.copy_workout_day(uuid, smallint, smallint) from public, anon;
grant execute on function public.copy_meal_day(uuid, smallint, smallint) to authenticated;
grant execute on function public.copy_workout_day(uuid, smallint, smallint) to authenticated;
