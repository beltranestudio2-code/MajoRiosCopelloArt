-- Correr UNA sola vez en Supabase → SQL Editor → New query → Run.
-- Agrega la serie/colección de cada obra (ej: "Vírgenes", "Corazones", "Hongos").

alter table public.obras add column if not exists serie text;
