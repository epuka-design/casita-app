# 🏡 Casita

App de gestión del hogar: menú semanal, recetas, lista del súper y tareas.

**Stack:** Next.js 14 (App Router) · Tailwind CSS · Clerk (auth + roles) · Supabase (datos).

---

## Arquitectura

- **Clerk** es la fuente de verdad de autenticación y roles. El rol vive en
  `publicMetadata.rol` de cada usuario: `admin` | `familia` | `ayudante`.
- **Supabase** guarda los datos. La tabla `users` refleja a los usuarios de
  Clerk (`clerk_user_id`) para joins y reportes.
- El [`middleware.ts`](./middleware.ts) protege rutas por rol; la navegación
  ([`nav-config.ts`](./src/components/nav-config.ts)) las oculta según rol.

```
src/
├── app/
│   ├── layout.tsx              # ClerkProvider + fuentes
│   ├── page.tsx                # landing
│   ├── sign-in / sign-up       # auth de Clerk
│   └── (app)/                  # zona autenticada (con Navbar)
│       ├── layout.tsx          # resuelve el rol → Navbar
│       ├── dashboard | menu | recetas | super | tareas | admin
├── components/  → Navbar, PageHeader, nav-config
├── lib/         → roles, supabase/{client,server,admin}
└── types/       → database.ts (tipos de tablas)
supabase/migration.sql          # esquema + RLS
```

## Puesta en marcha

```bash
npm install
cp .env.local.example .env.local   # completá las claves
npm run dev                        # http://localhost:3000
```

### 1. Clerk

1. Creá una app en <https://dashboard.clerk.com> y copiá las API keys a `.env.local`.
2. **Roles en el session token** (para que el middleware lea el rol):
   Clerk → *Sessions* → *Customize session token* → agregá:
   ```json
   { "metadata": "{{user.public_metadata}}" }
   ```
3. **JWT Template para Supabase** (para RLS): Clerk → *JWT Templates* →
   *New template* → nombre **`supabase`**. Esto permite que
   `auth.jwt()->>'sub'` en Supabase coincida con `users.clerk_user_id`.
4. **Asignar un rol** a un usuario: Clerk → *Users* → elegir usuario →
   *Metadata* → *Public* →
   ```json
   { "rol": "admin" }
   ```
   (o `"familia"` / `"ayudante"`). Sin rol asignado, por defecto es `familia`.

### 2. Supabase

1. Creá un proyecto en <https://supabase.com/dashboard> y copiá URL + anon key
   + service_role key a `.env.local`.
2. Ejecutá [`supabase/migration.sql`](./supabase/migration.sql) en el **SQL Editor**.
3. (Recomendado) Sincronizá usuarios con un **webhook de Clerk**
   (`user.created` / `user.updated`) que haga upsert en `public.users`
   usando el cliente `supabaseAdmin`.

## Roles y acceso

| Sección  | admin | familia | ayudante |
|----------|:-----:|:-------:|:--------:|
| Inicio   |  ✅   |   ✅    |   ✅     |
| Menú     |  ✅   |   ✅    |   ✅     |
| Recetas  |  ✅   |   ✅    |   —      |
| Súper    |  ✅   |   ✅    |   ✅     |
| Tareas   |  ✅   |   ✅    |   ✅     |
| Admin    |  ✅   |   —     |   —      |

## Diseño

Mobile-first y minimalista. Tipografías **Cormorant Garamond** (títulos) y
**DM Sans** (cuerpo). Paleta en [`tailwind.config.ts`](./tailwind.config.ts):
crema `#faf8f5`, terracota `#c8602a`, verde `#6b9e7a`, tinta `#1a1a1a`.
