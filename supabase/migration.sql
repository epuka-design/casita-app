-- ╔══════════════════════════════════════════════════════════════╗
-- ║  Casita — esquema inicial                                      ║
-- ║  Auth: Clerk  ·  Datos: Supabase                               ║
-- ║  Ejecutar en Supabase → SQL Editor (o vía CLI/migrations).     ║
-- ╚══════════════════════════════════════════════════════════════╝

-- Enum de roles (espejo de publicMetadata.rol en Clerk).
do $$ begin
  create type rol as enum ('admin', 'familia', 'ayudante');
exception when duplicate_object then null;
end $$;

-- ── users ───────────────────────────────────────────────────────
-- Refleja a los usuarios de Clerk. clerk_user_id = sub del JWT.
-- Se sincroniza desde un webhook de Clerk (user.created/updated).
create table if not exists public.users (
  id            uuid primary key default gen_random_uuid(),
  clerk_user_id text unique not null,
  nombre        text not null,
  email         text unique not null,
  rol           rol  not null default 'familia',
  avatar_url    text,
  created_at    timestamptz not null default now()
);

-- ── recetas ─────────────────────────────────────────────────────
create table if not exists public.recetas (
  id            uuid primary key default gen_random_uuid(),
  nombre        text not null,
  categoria     text,
  ingredientes  jsonb not null default '[]'::jsonb,
  instrucciones text,
  porciones     int  not null default 1,
  created_at    timestamptz not null default now()
);

-- ── menu_semanal ────────────────────────────────────────────────
create table if not exists public.menu_semanal (
  id         uuid primary key default gen_random_uuid(),
  semana     date not null,
  dia        text not null,   -- lunes..domingo
  tipo       text not null,   -- desayuno | almuerzo | cena | snack
  receta_id  uuid references public.recetas(id) on delete set null,
  aprobado   boolean not null default false,
  created_at timestamptz not null default now(),
  unique (semana, dia, tipo)
);

-- ── lista_super ─────────────────────────────────────────────────
create table if not exists public.lista_super (
  id         uuid primary key default gen_random_uuid(),
  tipo       text,            -- súper | farmacia | verdulería ...
  categoria  text,
  item       text not null,
  cantidad   text,
  tildado    boolean not null default false,
  fecha      date not null default current_date,
  created_at timestamptz not null default now()
);

-- ── tareas ──────────────────────────────────────────────────────
create table if not exists public.tareas (
  id        uuid primary key default gen_random_uuid(),
  nombre    text not null,
  ciclo     text,             -- diaria | semanal | mensual
  categoria text,
  orden     int not null default 0
);

-- ── tareas_completadas ──────────────────────────────────────────
create table if not exists public.tareas_completadas (
  id             uuid primary key default gen_random_uuid(),
  tarea_id       uuid not null references public.tareas(id) on delete cascade,
  fecha          date not null default current_date,
  completada_por uuid references public.users(id) on delete set null,
  created_at     timestamptz not null default now()
);

-- ── Índices ─────────────────────────────────────────────────────
create index if not exists idx_menu_semana       on public.menu_semanal (semana);
create index if not exists idx_lista_fecha        on public.lista_super (fecha);
create index if not exists idx_lista_tildado      on public.lista_super (tildado);
create index if not exists idx_tareas_orden       on public.tareas (orden);
create index if not exists idx_completadas_fecha  on public.tareas_completadas (fecha);
create index if not exists idx_completadas_tarea  on public.tareas_completadas (tarea_id);

-- ╔══════════════════════════════════════════════════════════════╗
-- ║  RLS con Clerk                                                 ║
-- ║  Requiere el JWT Template "supabase" en Clerk (ver README).    ║
-- ║  auth.jwt()->>'sub'  ==  users.clerk_user_id                   ║
-- ╚══════════════════════════════════════════════════════════════╝

-- Helpers: id del usuario actual y su rol, a partir del JWT de Clerk.
create or replace function public.current_clerk_id()
returns text language sql stable as $$
  select nullif(auth.jwt()->>'sub', '')
$$;

create or replace function public.current_rol()
returns rol language sql stable security definer set search_path = public as $$
  select rol from public.users where clerk_user_id = public.current_clerk_id()
$$;

create or replace function public.es_admin()
returns boolean language sql stable as $$
  select public.current_rol() = 'admin'
$$;

-- Habilitar RLS en todas las tablas.
alter table public.users              enable row level security;
alter table public.recetas            enable row level security;
alter table public.menu_semanal       enable row level security;
alter table public.lista_super        enable row level security;
alter table public.tareas             enable row level security;
alter table public.tareas_completadas enable row level security;

-- users: cada quien ve/edita su fila; admin ve todo.
drop policy if exists users_self_select on public.users;
create policy users_self_select on public.users for select
  using (clerk_user_id = public.current_clerk_id() or public.es_admin());

drop policy if exists users_self_update on public.users;
create policy users_self_update on public.users for update
  using (clerk_user_id = public.current_clerk_id() or public.es_admin());

-- Datos compartidos del hogar: cualquier usuario autenticado de la
-- casa puede leer y escribir. Excepción: borrar queda para admin.
do $$
declare t text;
begin
  foreach t in array array['recetas','menu_semanal','lista_super','tareas','tareas_completadas']
  loop
    execute format('drop policy if exists %1$s_read on public.%1$s', t);
    execute format(
      'create policy %1$s_read on public.%1$s for select using (public.current_clerk_id() is not null)', t);

    execute format('drop policy if exists %1$s_write on public.%1$s', t);
    execute format(
      'create policy %1$s_write on public.%1$s for insert with check (public.current_clerk_id() is not null)', t);

    execute format('drop policy if exists %1$s_update on public.%1$s', t);
    execute format(
      'create policy %1$s_update on public.%1$s for update using (public.current_clerk_id() is not null)', t);

    execute format('drop policy if exists %1$s_delete on public.%1$s', t);
    execute format(
      'create policy %1$s_delete on public.%1$s for delete using (public.es_admin())', t);
  end loop;
end $$;
