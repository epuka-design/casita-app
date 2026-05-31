-- ╔══════════════════════════════════════════════════════════════╗
-- ║  Casita — esquema MULTI-HOGAR                                  ║
-- ║  Auth: Clerk · Datos: Supabase                                 ║
-- ║  Cada usuario pertenece a un hogar; los datos se aíslan por    ║
-- ║  hogar_id. Ejecutar en Supabase → SQL Editor.                  ║
-- ╚══════════════════════════════════════════════════════════════╝

do $$ begin
  create type rol as enum ('admin', 'familia', 'ayudante');
exception when duplicate_object then null;
end $$;

-- ── hogares ──────────────────────────────────────────────────────
create table if not exists public.hogares (
  id         uuid primary key default gen_random_uuid(),
  nombre     text not null,
  codigo     text not null unique,   -- código de invitación (ej. CASA-7Q3X)
  created_at timestamptz not null default now()
);

-- ── users (pertenecen a un hogar) ────────────────────────────────
create table if not exists public.users (
  id            uuid primary key default gen_random_uuid(),
  clerk_user_id text unique not null,
  hogar_id      uuid references public.hogares(id) on delete set null,
  nombre        text not null,
  email         text not null,
  rol           rol  not null default 'familia',
  avatar_url    text,
  created_at    timestamptz not null default now()
);

-- ── recetas ──────────────────────────────────────────────────────
create table if not exists public.recetas (
  id            uuid primary key default gen_random_uuid(),
  hogar_id      uuid not null references public.hogares(id) on delete cascade,
  nombre        text not null,
  categoria     text,
  ingredientes  jsonb not null default '[]'::jsonb,
  instrucciones text,
  porciones     int  not null default 1,
  tiempo_min    int,
  created_at    timestamptz not null default now(),
  unique (hogar_id, nombre)
);

-- ── menu_semana (estado de la semana) ───────────────────────────
create table if not exists public.menu_semana (
  hogar_id     uuid not null references public.hogares(id) on delete cascade,
  semana       date not null,
  estado       text not null default 'borrador',
  creado_por   uuid references public.users(id) on delete set null,
  aprobado_por uuid references public.users(id) on delete set null,
  aprobado_at  timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  primary key (hogar_id, semana)
);

-- ── menu_semanal (un plato por día/tipo) ────────────────────────
create table if not exists public.menu_semanal (
  id         uuid primary key default gen_random_uuid(),
  hogar_id   uuid not null references public.hogares(id) on delete cascade,
  semana     date not null,
  dia        text not null,
  tipo       text not null,   -- almuerzo | cena
  receta_id  uuid references public.recetas(id) on delete set null,
  aprobado   boolean not null default false,
  created_at timestamptz not null default now(),
  unique (hogar_id, semana, dia, tipo)
);

-- ── lista_super_cab (estado de cada lista) ──────────────────────
create table if not exists public.lista_super_cab (
  hogar_id     uuid not null references public.hogares(id) on delete cascade,
  tipo         text not null,   -- mensual | semanal
  periodo      date not null,
  estado       text not null default 'borrador',
  generado_por uuid references public.users(id) on delete set null,
  aprobado_por uuid references public.users(id) on delete set null,
  aprobado_at  timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  primary key (hogar_id, tipo, periodo)
);

-- ── lista_super (items) ──────────────────────────────────────────
create table if not exists public.lista_super (
  id         uuid primary key default gen_random_uuid(),
  hogar_id   uuid not null references public.hogares(id) on delete cascade,
  tipo       text not null,
  categoria  text,
  item       text not null,
  cantidad   text,
  tildado    boolean not null default false,
  periodo    date,
  orden      int not null default 0,
  fecha      date not null default current_date,
  created_at timestamptz not null default now()
);

-- ── items_mensuales_fijos (plantilla por hogar) ─────────────────
create table if not exists public.items_mensuales_fijos (
  id        uuid primary key default gen_random_uuid(),
  hogar_id  uuid not null references public.hogares(id) on delete cascade,
  categoria text not null,
  item      text not null,
  orden     int not null default 0,
  unique (hogar_id, item)
);

-- ── tareas ──────────────────────────────────────────────────────
create table if not exists public.tareas (
  id        uuid primary key default gen_random_uuid(),
  hogar_id  uuid not null references public.hogares(id) on delete cascade,
  nombre    text not null,
  ciclo     text,             -- diaria | quincenal | mensual
  categoria text,             -- cocina | limpieza | niños | ropa
  orden     int not null default 0,
  unique (hogar_id, nombre)
);

-- ── tareas_completadas ──────────────────────────────────────────
create table if not exists public.tareas_completadas (
  id             uuid primary key default gen_random_uuid(),
  hogar_id       uuid not null references public.hogares(id) on delete cascade,
  tarea_id       uuid not null references public.tareas(id) on delete cascade,
  fecha          date not null default current_date,
  completada_por uuid references public.users(id) on delete set null,
  created_at     timestamptz not null default now(),
  unique (tarea_id, fecha)
);

-- ── hogar_config (cuántos comen, por hogar) ─────────────────────
create table if not exists public.hogar_config (
  hogar_id    uuid primary key references public.hogares(id) on delete cascade,
  adultos     int not null default 3,
  ninos       int not null default 2,
  factor_nino numeric not null default 0.5,
  updated_at  timestamptz not null default now()
);

-- ── Índices ─────────────────────────────────────────────────────
create index if not exists idx_users_hogar       on public.users (hogar_id);
create index if not exists idx_recetas_hogar      on public.recetas (hogar_id, categoria);
create index if not exists idx_menu_semanal_hogar on public.menu_semanal (hogar_id, semana);
create index if not exists idx_lista_hogar        on public.lista_super (hogar_id, tipo, periodo);
create index if not exists idx_tareas_hogar       on public.tareas (hogar_id, orden);
create index if not exists idx_completadas_hogar  on public.tareas_completadas (hogar_id, fecha);
create index if not exists idx_fijos_hogar        on public.items_mensuales_fijos (hogar_id, orden);

-- ╔══════════════════════════════════════════════════════════════╗
-- ║  RLS                                                          ║
-- ║  Todas las tablas con RLS habilitado y SIN políticas: solo el ║
-- ║  service_role (servidor) accede. La app filtra por hogar_id   ║
-- ║  en cada query. Nada llega al cliente sin pasar por el server.║
-- ╚══════════════════════════════════════════════════════════════╝
alter table public.hogares              enable row level security;
alter table public.users                enable row level security;
alter table public.recetas              enable row level security;
alter table public.menu_semana          enable row level security;
alter table public.menu_semanal         enable row level security;
alter table public.lista_super_cab      enable row level security;
alter table public.lista_super          enable row level security;
alter table public.items_mensuales_fijos enable row level security;
alter table public.tareas               enable row level security;
alter table public.tareas_completadas   enable row level security;
alter table public.hogar_config         enable row level security;

-- ╔══════════════════════════════════════════════════════════════╗
-- ║  seed_hogar(h) — precarga un hogar nuevo con datos de ejemplo ║
-- ║  (recetas, tareas, items fijos y config). Idempotente.        ║
-- ╚══════════════════════════════════════════════════════════════╝
create or replace function public.seed_hogar(h uuid)
returns void language sql as $func$
  insert into public.hogar_config (hogar_id) values (h)
  on conflict (hogar_id) do nothing;

  insert into public.tareas (hogar_id, nombre, ciclo, categoria, orden) values
    (h, 'Preparar almuerzo según menú del día', 'diaria',    'cocina',    10),
    (h, 'Lavar los platos',                      'diaria',    'cocina',    20),
    (h, 'Barrer y trapear',                      'diaria',    'limpieza',  30),
    (h, 'Ordenar cuartos de los chicos',         'diaria',    'niños',     40),
    (h, 'Poner ropa a lavar',                    'diaria',    'ropa',      50),
    (h, 'Limpiar heladera por dentro',           'quincenal', 'cocina',    60),
    (h, 'Limpiar horno y microondas',            'quincenal', 'cocina',    70),
    (h, 'Lavar baños a fondo',                   'quincenal', 'limpieza',  80),
    (h, 'Limpiar espejos y vidrios',             'quincenal', 'limpieza',  90),
    (h, 'Lavar ropa de cama',                    'quincenal', 'ropa',     100),
    (h, 'Limpiar ventanas',                      'mensual',   'limpieza', 110),
    (h, 'Limpiar fondos de armario',             'mensual',   'limpieza', 120),
    (h, 'Ordenar despensa',                      'mensual',   'cocina',   130),
    (h, 'Lavar juguetes de los chicos',          'mensual',   'niños',    140),
    (h, 'Limpiar muebles y estantes a fondo',    'mensual',   'limpieza', 150)
  on conflict (hogar_id, nombre) do nothing;

  insert into public.items_mensuales_fijos (hogar_id, categoria, item, orden) values
    (h, 'Aseo personal', 'Shampoo',                 10),
    (h, 'Aseo personal', 'Acondicionador',          20),
    (h, 'Aseo personal', 'Crema dental',            30),
    (h, 'Aseo personal', 'Jabón',                   40),
    (h, 'Aseo personal', 'Desodorante',             50),
    (h, 'Limpieza',      'Lavandina',               60),
    (h, 'Limpieza',      'Detergente lavavajillas', 70),
    (h, 'Limpieza',      'Detergente ropa',         80),
    (h, 'Limpieza',      'Suavizante',              90),
    (h, 'Limpieza',      'Esponjas',               100),
    (h, 'Limpieza',      'Trapos de piso',         110),
    (h, 'Despensa base', 'Aceite',                 120),
    (h, 'Despensa base', 'Sal',                    130),
    (h, 'Despensa base', 'Azúcar',                 140),
    (h, 'Despensa base', 'Arroz integral',         150),
    (h, 'Despensa base', 'Arroz kesu',             160),
    (h, 'Despensa base', 'Harina',                 170),
    (h, 'Despensa base', 'Caldo',                  180),
    (h, 'Despensa base', 'Pasta de tomate',        190),
    (h, 'Despensa base', 'Mostaza',                200),
    (h, 'Despensa base', 'Miel',                   210)
  on conflict (hogar_id, item) do nothing;

  -- FIT / SALUDABLE (con detalle)
  insert into public.recetas (hogar_id, nombre, categoria, tiempo_min, porciones, ingredientes, instrucciones) values
  (h, 'Pollo al limón con verduras asadas', 'Fit/Saludable', 45, 4,
   '[{"nombre":"Pechugas de pollo","cantidad":"4"},{"nombre":"Limón","cantidad":"2"},{"nombre":"Ajo","cantidad":"3 dientes"},{"nombre":"Aceite de oliva","cantidad":"3 cdas"},{"nombre":"Zucchini","cantidad":"2"},{"nombre":"Morrón rojo","cantidad":"1"},{"nombre":"Cebolla","cantidad":"1"},{"nombre":"Zanahoria","cantidad":"2"},{"nombre":"Romero","cantidad":"1 ramita"},{"nombre":"Sal y pimienta","cantidad":"a gusto"}]'::jsonb,
   E'Precalentar el horno a 200°C.\nMarinar el pollo con jugo de limón, ajo, aceite, sal y pimienta 15 minutos.\nCortar las verduras y disponerlas en una fuente con aceite, sal y romero.\nColocar el pollo sobre las verduras y hornear 30 a 35 minutos.\nServir con jugo de limón fresco.'),
  (h, 'Pechuga grillada con puré de coliflor', 'Fit/Saludable', 35, 4,
   '[{"nombre":"Pechugas de pollo","cantidad":"4"},{"nombre":"Coliflor","cantidad":"1 mediana"},{"nombre":"Leche descremada","cantidad":"1/2 taza"},{"nombre":"Ajo","cantidad":"2 dientes"},{"nombre":"Aceite de oliva","cantidad":"2 cdas"},{"nombre":"Nuez moscada","cantidad":"1 pizca"},{"nombre":"Perejil","cantidad":"a gusto"},{"nombre":"Sal y pimienta","cantidad":"a gusto"}]'::jsonb,
   E'Hervir la coliflor hasta que esté tierna y procesarla con leche, ajo, sal, pimienta y nuez moscada.\nGrillar las pechugas salpimentadas 5 a 6 minutos por lado.\nServir sobre el puré y espolvorear perejil.'),
  (h, 'Salmón al horno con vegetales', 'Fit/Saludable', 30, 2,
   '[{"nombre":"Filetes de salmón","cantidad":"2"},{"nombre":"Brócoli","cantidad":"1 taza"},{"nombre":"Tomates cherry","cantidad":"1 taza"},{"nombre":"Espárragos","cantidad":"1 atado"},{"nombre":"Limón","cantidad":"1"},{"nombre":"Aceite de oliva","cantidad":"2 cdas"},{"nombre":"Ajo","cantidad":"2 dientes"},{"nombre":"Eneldo","cantidad":"a gusto"},{"nombre":"Sal y pimienta","cantidad":"a gusto"}]'::jsonb,
   E'Precalentar el horno a 200°C.\nDisponer los vegetales con aceite, ajo, sal y pimienta.\nColocar el salmón encima, rociar con limón y eneldo.\nHornear 18 a 20 minutos.'),
  (h, 'Bowl de pollo con arroz integral y vegetales', 'Fit/Saludable', 40, 2,
   '[{"nombre":"Pechuga de pollo","cantidad":"2"},{"nombre":"Arroz integral","cantidad":"1 taza"},{"nombre":"Palta","cantidad":"1"},{"nombre":"Zanahoria","cantidad":"1"},{"nombre":"Repollo morado","cantidad":"1 taza"},{"nombre":"Choclo","cantidad":"1/2 taza"},{"nombre":"Aceite de oliva","cantidad":"2 cdas"},{"nombre":"Limón","cantidad":"1"},{"nombre":"Sal, pimienta y pimentón","cantidad":"a gusto"}]'::jsonb,
   E'Hervir el arroz integral y reservar.\nSaltear el pollo en cubos con pimentón, sal y pimienta.\nArmar el bowl con base de arroz, el pollo y los vegetales.\nAliñar con aceite y limón.'),
  (h, 'Zapallitos rellenos de carne', 'Fit/Saludable', 50, 4,
   '[{"nombre":"Zapallitos redondos","cantidad":"8"},{"nombre":"Carne picada magra","cantidad":"500 g"},{"nombre":"Cebolla","cantidad":"1"},{"nombre":"Ajo","cantidad":"2 dientes"},{"nombre":"Tomate","cantidad":"1"},{"nombre":"Huevo","cantidad":"1"},{"nombre":"Queso rallado","cantidad":"3 cdas"},{"nombre":"Aceite de oliva","cantidad":"2 cdas"},{"nombre":"Sal, pimienta y orégano","cantidad":"a gusto"}]'::jsonb,
   E'Hervir los zapallitos 8 minutos y ahuecarlos.\nRehogar cebolla y ajo, sumar la carne y la pulpa, cocinar.\nAgregar tomate, condimentar y retirar. Mezclar con huevo y queso.\nRellenar, cubrir con queso y hornear a 180°C por 20 minutos.'),
  (h, 'Strogonoff de pollo con arroz kesu', 'Fit/Saludable', 40, 4,
   '[{"nombre":"Pechuga de pollo","cantidad":"500 g"},{"nombre":"Cebolla","cantidad":"1"},{"nombre":"Champiñones","cantidad":"200 g"},{"nombre":"Crema light","cantidad":"200 ml"},{"nombre":"Mostaza","cantidad":"1 cda"},{"nombre":"Arroz","cantidad":"2 tazas"},{"nombre":"Queso Paraguay","cantidad":"200 g"},{"nombre":"Leche","cantidad":"1 taza"},{"nombre":"Aceite","cantidad":"2 cdas"},{"nombre":"Sal y pimienta","cantidad":"a gusto"}]'::jsonb,
   E'Arroz kesu: hervir el arroz y mezclar caliente con queso Paraguay y leche.\nDorar el pollo en tiras y reservar.\nRehogar cebolla y champiñones, volver el pollo, agregar crema y mostaza.\nServir con el arroz kesu.'),
  (h, 'Wrap integral de pollo y verduras', 'Fit/Saludable', 20, 2,
   '[{"nombre":"Tortillas integrales","cantidad":"2"},{"nombre":"Pechuga de pollo cocida","cantidad":"1"},{"nombre":"Lechuga","cantidad":"varias hojas"},{"nombre":"Tomate","cantidad":"1"},{"nombre":"Zanahoria rallada","cantidad":"1"},{"nombre":"Palta","cantidad":"1/2"},{"nombre":"Yogur natural","cantidad":"2 cdas"},{"nombre":"Mostaza","cantidad":"1 cdita"},{"nombre":"Sal y pimienta","cantidad":"a gusto"}]'::jsonb,
   E'Desmenuzar el pollo cocido.\nMezclar yogur con mostaza, sal y pimienta.\nDistribuir lechuga, tomate, zanahoria, palta y pollo sobre las tortillas.\nAgregar la salsa, enrollar y cortar.'),
  (h, 'Cerdo al horno con miel y mostaza', 'Fit/Saludable', 60, 4,
   '[{"nombre":"Bondiola de cerdo","cantidad":"800 g"},{"nombre":"Miel","cantidad":"3 cdas"},{"nombre":"Mostaza","cantidad":"2 cdas"},{"nombre":"Ajo","cantidad":"3 dientes"},{"nombre":"Jugo de naranja","cantidad":"1/2 taza"},{"nombre":"Aceite de oliva","cantidad":"2 cdas"},{"nombre":"Batata","cantidad":"2"},{"nombre":"Romero","cantidad":"a gusto"},{"nombre":"Sal y pimienta","cantidad":"a gusto"}]'::jsonb,
   E'Precalentar el horno a 190°C.\nMezclar miel, mostaza, ajo, jugo de naranja, aceite, sal y pimienta.\nUntar el cerdo y disponer con las batatas.\nHornear 45 a 55 minutos pincelando con el jugo. Cortar en fetas y servir.')
  on conflict (hogar_id, nombre) do nothing;

  -- CASERO PARAGUAYO / CARNES / POLLO (sólo nombres)
  insert into public.recetas (hogar_id, nombre, categoria, porciones) values
    (h, 'Vori vori de pollo', 'Casero Paraguayo', 4),
    (h, 'Soyo con tortilla', 'Casero Paraguayo', 4),
    (h, 'Caldo de pollo casero', 'Casero Paraguayo', 4),
    (h, 'Caldo de poroto', 'Casero Paraguayo', 4),
    (h, 'Kure chyryry', 'Casero Paraguayo', 4),
    (h, 'Bife koygua', 'Casero Paraguayo', 4),
    (h, 'Estofado de carne con arroz', 'Casero Paraguayo', 4),
    (h, 'Guiso de arroz', 'Casero Paraguayo', 4),
    (h, 'Tallarín casero con carne', 'Casero Paraguayo', 4),
    (h, 'Milanesa de carne con puré', 'Casero Paraguayo', 4),
    (h, 'Tiras de carne salteadas con morrones', 'Carnes', 4),
    (h, 'Strogonoff de carne', 'Carnes', 4),
    (h, 'Bife a la plancha con verduras', 'Carnes', 4),
    (h, 'Asado a la olla con puré de batata', 'Carnes', 4),
    (h, 'Hamburguesas caseras', 'Carnes', 4),
    (h, 'Albóndigas al horno', 'Carnes', 4),
    (h, 'Carne al horno con romero', 'Carnes', 4),
    (h, 'Goulash', 'Carnes', 4),
    (h, 'Ragú de carne', 'Carnes', 4),
    (h, 'Lomo salteado oriental', 'Carnes', 4),
    (h, 'Costeletas de cerdo', 'Carnes', 4),
    (h, 'Cerdo con miel y mostaza', 'Carnes', 4),
    (h, 'Moussaka', 'Carnes', 4),
    (h, 'Zapallitos rellenos', 'Carnes', 4),
    (h, 'Pollo al limón y miel', 'Pollo', 4),
    (h, 'Pechuga con puré de coliflor', 'Pollo', 4),
    (h, 'Pollo relleno con espinaca y jamón', 'Pollo', 4),
    (h, 'Pollo al horno', 'Pollo', 4),
    (h, 'Strogonoff de pollo', 'Pollo', 4),
    (h, 'Pollo oriental', 'Pollo', 4),
    (h, 'Pollo cremoso con champiñones', 'Pollo', 4),
    (h, 'Vori vori', 'Pollo', 4),
    (h, 'Tiritas de pollo con zucchini', 'Pollo', 4),
    (h, 'Pollo al curry', 'Pollo', 4),
    (h, 'Pollo a la mostaza', 'Pollo', 4),
    (h, 'Supremas al horno', 'Pollo', 4)
  on conflict (hogar_id, nombre) do nothing;
$func$;
