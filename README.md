# Majo Rioscopello — sitio + panel de gestión

Dos experiencias en un solo proyecto:

- **`/`** — catálogo público: fotos, nombres y precios de las obras disponibles. Sin login.
- **`/admin`** — panel privado para cargar/editar/ocultar obras (alimenta el catálogo público).
- **`/gestion`** — panel privado de negocio: stock, costos, ventas (comprador y contacto), y rentabilidad calculada.

`/admin` y `/gestion` piden el mismo login y no aparecen indexados ni linkeados desde el catálogo público (solo un enlace discreto "Acceso privado" al pie).

## 1. Crear el backend gratis en Supabase

1. Entrá a [supabase.com](https://supabase.com) y creá una cuenta gratis (con GitHub o email).
2. Creá un proyecto nuevo (elegí una contraseña de base de datos y guardala).
3. Andá a **SQL Editor** → **New query**, pegá todo el contenido de [`supabase/schema.sql`](supabase/schema.sql) y ejecutalo (botón Run). Esto crea las tablas `obras` y `ventas`, la seguridad, y el espacio para las fotos.
4. Andá a **Authentication → Users → Add user** y creá el usuario con el que ella va a entrar a `/admin` y `/gestion` (email + contraseña).
5. Andá a **Project Settings → API** y copiá:
   - **Project URL**
   - **anon public key**

## 2. Configurar el proyecto localmente

1. Copiá el archivo `.env.example` a `.env`.
2. Completá `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` con los datos del paso anterior.
3. Instalá dependencias y corré el sitio en tu computadora:

```bash
npm install
npm run dev
```

Esto abre el sitio en `http://localhost:5173`. Entrá a `/login` con el usuario que creaste para probar `/admin` y `/gestion`.

## 3. Publicarlo gratis (Vercel o Netlify)

Cualquiera de las dos opciones sirve, son gratis para este uso. Con Vercel:

1. Subí este proyecto a un repositorio de GitHub.
2. Entrá a [vercel.com](https://vercel.com), creá cuenta gratis, "Add New Project" e importá el repositorio.
3. En **Environment Variables**, cargá `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` (los mismos valores del `.env`).
4. Deploy. Te da una URL tipo `majo-rioscopello.vercel.app`.

Si más adelante quieren un dominio propio (ej. `majorioscopelloart.com`), se conecta desde la configuración del proyecto en Vercel/Netlify sin tener que tocar el código.

## Cosas para saber

- **El proyecto de Supabase gratis se "pausa" solo si nadie lo usa por ~1 semana.** Al primer visitante después de la pausa, tarda unos segundos extra en reactivarse; no se pierde ningún dato.
- **`/admin` y `/gestion` no son secretos por oscuridad**: están protegidos por login real (Supabase Auth) y por reglas de seguridad en la base de datos (nadie sin login puede leer ni escribir ventas, costos o datos de compradores), no solo por no estar linkeados.
- Si en algún momento quieren que más de una persona tenga su propio usuario y contraseña, se crean desde **Authentication → Users** en Supabase, sin tocar código.
- El stock se descuenta solo al registrar una venta en `/gestion`, y la obra se oculta sola del catálogo público cuando llega a 0.
