create table public.habit_board (
  id integer primary key default 1 check (id = 1),
  notes text not null default '',
  constraint habit_board_notes_length check (char_length(notes) <= 2000)
);

insert into public.habit_board (id, notes) values (1, '');

create table public.habits (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sets smallint,
  reps text not null default '',
  weight_kg numeric(6, 2),
  rest_seconds integer,
  notes text not null default '',
  sort_order integer not null default 0,
  photo_path text,
  constraint habits_name_length check (char_length(name) between 1 and 120),
  constraint habits_sets_range check (sets is null or sets between 1 and 30),
  constraint habits_reps_length check (char_length(reps) <= 40),
  constraint habits_weight_range check (weight_kg is null or weight_kg between 0 and 500),
  constraint habits_rest_range check (rest_seconds is null or rest_seconds between 0 and 900),
  constraint habits_notes_length check (char_length(notes) <= 500),
  constraint habits_photo_path_length check (photo_path is null or char_length(photo_path) <= 180)
);

insert into public.habits (name, notes, sort_order)
select seed.name, seed.notes, seed.sort_order
from (
  values
    ('Andar'::text, '10.000 pasos al día'::text, 0),
    ('Agua', 'Beber 2 litros', 1),
    ('Cinta', 'Después de cada entreno, intervalos de inclinación', 2)
) as seed(name, notes, sort_order)
where not exists (select 1 from public.habits);

alter table public.habit_board enable row level security;
alter table public.habits enable row level security;

create policy habit_board_select on public.habit_board
  for select to authenticated
  using (true);

create policy habit_board_update on public.habit_board
  for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy habits_select on public.habits
  for select to authenticated
  using (true);

create policy habits_write on public.habits
  for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

revoke all on table public.habit_board from anon, authenticated, public;
revoke all on table public.habits from anon, authenticated, public;

grant select, update on table public.habit_board to authenticated;
grant select, insert, update, delete on table public.habits to authenticated;

create policy plan_photos_shared_read on storage.objects
  for select to authenticated
  using (
    bucket_id = 'plan-photos'
    and (storage.foldername(name))[1] = 'shared'
  );
