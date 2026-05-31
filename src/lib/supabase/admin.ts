import "server-only";
import { createClient } from "@supabase/supabase-js";

// Cliente con service_role: SALTEA RLS. Usar SOLO en código server-side
// de confianza (route handlers, server actions, webhooks de Clerk para
// sincronizar la tabla `users`). Nunca importar desde el cliente.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);
