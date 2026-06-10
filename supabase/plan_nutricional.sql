-- Módulo Plan Nutricional. Correr una vez en Supabase → SQL Editor
-- sobre una base ya creada. Idempotente.

create table if not exists public.planes_nutricionales (
  id          uuid primary key default gen_random_uuid(),
  hogar_id    uuid not null references public.hogares(id) on delete cascade,
  fecha_carga timestamptz not null default now(),
  semana      date not null,
  datos_raw   jsonb not null default '{}'::jsonb,
  aprobado    boolean not null default false,
  created_at  timestamptz not null default now()
);

create table if not exists public.lista_super_items (
  id             uuid primary key default gen_random_uuid(),
  hogar_id       uuid not null references public.hogares(id) on delete cascade,
  plan_id        uuid not null references public.planes_nutricionales(id) on delete cascade,
  categoria      text not null,
  nombre         text not null,
  cantidad_total text,
  unidad         text,
  detalle        text,
  tildado        boolean not null default false,
  orden          int not null default 0,
  created_at     timestamptz not null default now()
);

alter table public.recetas
  add column if not exists adaptacion_ninos text;

alter table public.planes_nutricionales enable row level security;
alter table public.lista_super_items    enable row level security;
