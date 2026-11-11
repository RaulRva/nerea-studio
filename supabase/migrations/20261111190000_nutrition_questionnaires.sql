create table public.nutrition_questionnaires (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  nombre text not null,
  correo text not null,
  edad smallint,
  sexo text not null default '',
  altura_cm numeric(5, 1),
  peso_kg numeric(5, 2),
  peso_objetivo_kg numeric(5, 2),
  objetivo text not null default '',
  actividad text not null default '',
  trabajo text not null default '',
  entrenamiento text not null default '',
  frecuencia text not null default '',
  horario text not null default '',
  patologias text not null default '',
  medicacion text not null default '',
  alergias text not null default '',
  suplementos text not null default '',
  comidas text not null default '',
  horarios text not null default '',
  alimentos_gustan text not null default '',
  alimentos_no text not null default '',
  restricciones text not null default '',
  agua text not null default '',
  alcohol text not null default '',
  sueno text not null default '',
  digestiones text not null default '',
  observaciones text not null default '',
  constraint nutrition_questionnaires_nombre_length check (char_length(nombre) between 2 and 80),
  constraint nutrition_questionnaires_correo_length check (char_length(correo) between 5 and 160)
);

alter table public.nutrition_questionnaires enable row level security;

revoke all on table public.nutrition_questionnaires from anon, authenticated, public;
