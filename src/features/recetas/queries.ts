import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { RecetaRow } from "@/types/database";

// Lecturas server-side, siempre acotadas al hogar.

export async function getRecetas(hogarId: string): Promise<RecetaRow[]> {
  const { data, error } = await supabaseAdmin
    .from("recetas")
    .select("*")
    .eq("hogar_id", hogarId)
    .order("nombre", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as RecetaRow[];
}

export async function getReceta(
  hogarId: string,
  id: string
): Promise<RecetaRow | null> {
  const { data, error } = await supabaseAdmin
    .from("recetas")
    .select("*")
    .eq("hogar_id", hogarId)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as RecetaRow) ?? null;
}
