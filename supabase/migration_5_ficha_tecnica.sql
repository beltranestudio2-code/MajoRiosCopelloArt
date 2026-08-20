-- Correr UNA sola vez en Supabase → SQL Editor → New query → Run.
-- Reemplaza la descripción libre por una ficha técnica: Técnica, Medidas y Enmarcado.
-- No borra la columna "descripcion" vieja (por las dudas), solo deja de usarse desde /admin.

alter table public.obras add column if not exists tecnica text;
alter table public.obras add column if not exists medidas text;
alter table public.obras add column if not exists enmarcado text;
