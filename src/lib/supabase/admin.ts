import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Cliente con service_role: SALTEA RLS. Usar SOLO en código server-side
// de confianza (server actions, queries). Nunca importar desde el cliente.
//
// Se crea de forma perezosa: así importar este módulo no requiere las
// env vars (el build de Next puede recolectar las páginas sin fallar);
// el cliente se instancia recién en el primer uso real.
let _cliente: SupabaseClient | null = null;

function getCliente(): SupabaseClient {
  if (_cliente) return _cliente;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el entorno."
    );
  }
  _cliente = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _cliente;
}

export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const cliente = getCliente();
    const valor = cliente[prop as keyof SupabaseClient];
    return typeof valor === "function" ? valor.bind(cliente) : valor;
  },
});
