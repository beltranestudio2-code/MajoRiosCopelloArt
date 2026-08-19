-- Correr UNA sola vez en Supabase → SQL Editor → New query → Run.
-- Agrega la tabla de configuración (tipo de cambio) que faltaba del schema.sql original.
-- Si ya corriste schema.sql actualizado, no hace falta correr esto también.

create table if not exists public.configuracion (
  id int primary key default 1,
  tipo_cambio numeric not null default 1000,
  updated_at timestamptz not null default now(),
  constraint configuracion_single_row check (id = 1)
);

insert into public.configuracion (id, tipo_cambio) values (1, 1000)
on conflict (id) do nothing;

alter table public.configuracion enable row level security;

create policy "configuracion: todo solo autenticado" on public.configuracion
  for all to authenticated
  using (true)
  with check (true);
