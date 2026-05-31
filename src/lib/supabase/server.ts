import { createClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";

// Cliente de Supabase para Server Components / Route Handlers.
//
// Como la auth la maneja Clerk (no Supabase Auth), inyectamos el
// token de sesión de Clerk como Bearer. Para que las políticas RLS
// funcionen con `auth.jwt()->>'sub'`, configurá en Clerk un JWT
// Template llamado "supabase" (ver README). Si no existe, el cliente
// igual funciona pero sin identidad para RLS.
export async function createServerSupabase() {
  const { getToken } = await auth();
  const token = await getToken({ template: "supabase" }).catch(() => null);

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
    }
  );
}
