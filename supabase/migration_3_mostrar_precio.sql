-- Correr UNA sola vez en Supabase → SQL Editor → New query → Run.
-- Agrega la opción de mostrar u ocultar el precio de cada obra en el catálogo público
-- (para obras exclusivas donde se prefiere que el interesado consulte por WhatsApp).

alter table public.obras add column if not exists mostrar_precio boolean not null default false;

-- Las obras que ya estaban publicadas siguen mostrando el precio como hasta ahora.
-- De acá en adelante, las obras nuevas nacen con el precio oculto por defecto
-- (mostrando "Consultar precio"), salvo que se tilde lo contrario al cargarlas.
update public.obras set mostrar_precio = true;
