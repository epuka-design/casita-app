"use client";

import { createBrowserClient } from "@supabase/ssr";

// Cliente de Supabase para componentes de cliente.
// Auth la maneja Clerk; Supabase se usa sólo para datos.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
