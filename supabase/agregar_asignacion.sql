-- Agrega "responsable" a las tareas (para asignarlas a una persona).
-- Correr una vez en Supabase → SQL Editor sobre una base ya creada.
-- Idempotente: si ya existe la columna, no hace nada.
alter table public.tareas
  add column if not exists asignado_a uuid references public.users(id) on delete set null;
