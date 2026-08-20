-- Ejecutar este script completo en Supabase → SQL Editor → New query → Run.
-- Crea las tablas, la seguridad (RLS) y el bucket de fotos.

-- ============ TABLA: obras (catálogo público + costos/stock privados) ============
create table if not exists public.obras (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  descripcion text,
  tecnica text,
  medidas text,
  enmarcado text,
  serie text,
  precio numeric not null default 0,
  costo numeric not null default 0,
  foto_url text,
  foto_url_2 text,
  foto_url_3 text,
  stock int not null default 0,
  disponible boolean not null default true,
  vendido boolean not null default false,
  mostrar_precio boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.obras enable row level security;

-- Cualquier visitante puede ver las obras marcadas como disponibles (catálogo público).
-- Un usuario logueado (la dueña del sitio) puede ver TODAS, incluidas las ocultas.
create policy "obras: lectura publica de disponibles" on public.obras
  for select
  using (disponible = true or auth.role() = 'authenticated');

-- Solo un usuario logueado puede crear, editar o borrar obras.
create policy "obras: escritura solo autenticado" on public.obras
  for insert to authenticated
  with check (true);

create policy "obras: actualizacion solo autenticado" on public.obras
  for update to authenticated
  using (true)
  with check (true);

create policy "obras: borrado solo autenticado" on public.obras
  for delete to authenticated
  using (true);

-- ============ TABLA: ventas (100% privada: comprador, contacto, precio real) ============
create table if not exists public.ventas (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references public.obras(id) on delete cascade,
  fecha_venta date not null default current_date,
  comprador_nombre text not null,
  comprador_contacto text,
  precio_venta numeric not null,
  created_at timestamptz not null default now()
);

alter table public.ventas enable row level security;

-- Nadie sin login puede leer ni escribir ventas: ahí vive la info de clientes y plata.
create policy "ventas: todo solo autenticado" on public.ventas
  for all to authenticated
  using (true)
  with check (true);

-- ============ TABLA: configuracion (tipo de cambio para calcular rentabilidad) ============
-- Los precios de venta se cargan en USD y los costos en ARS, así que hace falta
-- un tipo de cambio para poder calcular la rentabilidad en una sola moneda.
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

-- ============ STORAGE: bucket para las fotos de las obras ============
insert into storage.buckets (id, name, public)
values ('obras', 'obras', true)
on conflict (id) do nothing;

create policy "fotos obras: lectura publica" on storage.objects
  for select
  using (bucket_id = 'obras');

create policy "fotos obras: subida solo autenticado" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'obras');

create policy "fotos obras: borrado solo autenticado" on storage.objects
  for delete to authenticated
  using (bucket_id = 'obras');
