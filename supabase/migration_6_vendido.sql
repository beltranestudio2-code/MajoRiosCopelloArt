-- Correr UNA sola vez en Supabase → SQL Editor → New query → Run.
-- Marca si una obra ya está vendida, sin tener que ocultarla del catálogo
-- (para poder mostrarla igual con una etiqueta roja "Vendido").

alter table public.obras add column if not exists vendido boolean not null default false;
