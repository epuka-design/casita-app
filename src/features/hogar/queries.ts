import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Role } from "@/lib/roles";

export interface HogarInfo {
  nombre: string;
  codigo: string;
}

export interface Miembro {
  id: string;
  clerk_user_id: string;
  nombre: string;
  email: string;
  rol: Role;
}

export async function getHogarInfo(hogarId: string): Promise<HogarInfo | null> {
  const { data } = await supabaseAdmin
    .from("hogares")
    .select("nombre, codigo")
    .eq("id", hogarId)
    .maybeSingle();
  return (data as HogarInfo) ?? null;
}

export async function getMiembros(hogarId: string): Promise<Miembro[]> {
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("id, clerk_user_id, nombre, email, rol")
    .eq("hogar_id", hogarId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as Miembro[];
}
