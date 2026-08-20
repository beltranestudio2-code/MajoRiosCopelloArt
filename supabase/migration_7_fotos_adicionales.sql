-- Correr UNA sola vez en Supabase → SQL Editor → New query → Run.
-- Permite cargar una segunda y tercera foto por obra.

alter table public.obras add column if not exists foto_url_2 text;
alter table public.obras add column if not exists foto_url_3 text;
