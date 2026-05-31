# 🚀 Desplegar Casita en Vercel

Guía paso a paso para poner Casita en producción. Tiempo estimado: ~15 min.

El repo ya está en GitHub: **https://github.com/epuka-design/casita-app** (privado).

---

## Requisitos previos

Vas a necesitar una cuenta (gratis) en cada uno:

- [Vercel](https://vercel.com) — hosting
- [Clerk](https://clerk.com) — autenticación y roles
- [Supabase](https://supabase.com) — base de datos
- [Anthropic](https://console.anthropic.com) — IA del botón "Sugerí menú"

---

## 1. Supabase (base de datos)

1. Creá un proyecto en <https://supabase.com/dashboard>.
2. Andá a **SQL Editor**, pegá el contenido de
   [`supabase/migration.sql`](./supabase/migration.sql) y ejecutalo.
   Crea las tablas multi-hogar, índices, RLS y la función `seed_hogar()`.
   > No hace falta correr ningún seed a mano: **cada hogar se precarga solo**
   > (recetas, tareas, items fijos) cuando alguien lo crea desde la app.
3. En **Project Settings → API**, copiá:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** (secreto) → `SUPABASE_SERVICE_ROLE_KEY`

> El `service_role` es secreto: nunca lo expongas en el cliente. Solo se usa en server actions.

---

## 2. Clerk (auth + roles)

1. Creá una aplicación en <https://dashboard.clerk.com>.
2. En **API Keys**, copiá:
   - **Publishable key** → `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - **Secret key** → `CLERK_SECRET_KEY`
3. **Roles en el session token** (para que el middleware lea el rol):
   Clerk → **Sessions → Customize session token** → agregá:
   ```json
   { "metadata": "{{user.public_metadata}}" }
   ```
4. **JWT Template para Supabase** (para que funcione RLS):
   Clerk → **JWT Templates → New template** → nombre exacto **`supabase`**.
5. Más adelante (paso 5) asignás el rol admin a tu usuario.

---

## 3. Anthropic (IA)

1. Creá una API key en <https://console.anthropic.com> → **API Keys**.
2. Copiala → `ANTHROPIC_API_KEY`.

---

## 4. Importar en Vercel

1. Entrá a **<https://vercel.com/new>** → **Import Git Repository**.
2. Autorizá la cuenta **epuka-design** y elegí **`casita-app`**.
3. Framework Preset: **Next.js** (lo detecta solo). Root Directory: `./`.
4. Desplegá la sección **Environment Variables** y cargá todas estas:

   | Variable | Valor |
   |---|---|
   | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | de Clerk (paso 2) |
   | `CLERK_SECRET_KEY` | de Clerk (paso 2) |
   | `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/sign-in` |
   | `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `/sign-up` |
   | `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` | `/dashboard` |
   | `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL` | `/dashboard` |
   | `NEXT_PUBLIC_SUPABASE_URL` | de Supabase (paso 1) |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | de Supabase (paso 1) |
   | `SUPABASE_SERVICE_ROLE_KEY` | de Supabase (paso 1) |
   | `ANTHROPIC_API_KEY` | de Anthropic (paso 3) |
   | `ANTHROPIC_MODEL` | *(opcional)* `claude-sonnet-4-6` |

5. Click en **Deploy**. Vercel buildea y te da una URL `https://casita-app-xxxx.vercel.app`.

---

## 5. Después del primer deploy (multi-hogar)

1. **Clerk — dominio de producción**: si usás la instancia de producción de Clerk, agregá el dominio de Vercel en Clerk (**Domains**). Con la instancia de desarrollo de Clerk, el dominio `*.vercel.app` ya funciona.
2. Entrá a la URL y **registrate**. La primera vez la app te lleva al **onboarding**:
   - **Crear un hogar** → quedás **admin** automáticamente y se precargan los datos de ejemplo. Te muestra un **código de invitación** (ej. `CASA-7Q3X`).
   - Tu familia entra al mismo link, se registra y elige **Unirme a un hogar** con ese código (entran como `familia`).
3. ¡Listo! Como admin vas a ver el **Dashboard**.

> Ya **no se asignan roles a mano en Clerk**: el que crea el hogar es admin; los demás se suman con el código. (El claim de sesión del paso 2.3 es lo que hace que el rol funcione en las rutas.)

---

## Desarrollo local

```bash
git clone https://github.com/epuka-design/casita-app
cd casita-app
npm install
cp .env.local.example .env.local   # completá con las claves reales
npm run dev                         # http://localhost:3000
```

---

## Problemas comunes

- **Cartel "Clerk: auth() was called but Clerk can't detect clerkMiddleware()"** en el primer request en dev: es el compile inicial del middleware; recargá la página.
- **Badge rojo "error" de Clerk**: aparece solo si las claves son inválidas o falsas (Clerk no puede cargar su script). Con claves reales desaparece.
- **El menú/súper/recetas aparecen vacíos**: faltó correr `seed.sql` en Supabase.
- **RLS bloquea lecturas**: la app usa `service_role` en el server, así que funciona aunque no hayas creado el JWT Template — pero conviene crearlo igual (paso 2.4) como segunda capa de seguridad.
- **El botón "Sugerí menú" falla**: revisá que `ANTHROPIC_API_KEY` esté cargada en Vercel.
