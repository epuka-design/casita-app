import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { EstadoMenu } from "@/types/database";

export interface MenuSemanaData {
  estado: EstadoMenu;
  // clave `${dia}|${tipo}` → receta_id
  slots: Record<string, string>;
}

export async function getMenuSemana(
  hogarId: string,
  semana: string
): Promise<MenuSemanaData> {
  const [{ data: cab }, { data: items, error }] = await Promise.all([
    supabaseAdmin
      .from("menu_semana")
      .select("estado")
      .eq("hogar_id", hogarId)
      .eq("semana", semana)
      .maybeSingle(),
    supabaseAdmin
      .from("menu_semanal")
      .select("dia, tipo, receta_id")
      .eq("hogar_id", hogarId)
      .eq("semana", semana),
  ]);
  if (error) throw new Error(error.message);

  const slots: Record<string, string> = {};
  for (const it of items ?? []) {
    if (it.receta_id) slots[`${it.dia}|${it.tipo}`] = it.receta_id as string;
  }

  return {
    estado: (cab?.estado as EstadoMenu) ?? "borrador",
    slots,
  };
}

// Estado de la semana (liviano, para el indicador del admin en el nav).
export async function getEstadoSemana(
  hogarId: string,
  semana: string
): Promise<EstadoMenu | null> {
  const { data } = await supabaseAdmin
    .from("menu_semana")
    .select("estado")
    .eq("hogar_id", hogarId)
    .eq("semana", semana)
    .maybeSingle();
  return (data?.estado as EstadoMenu) ?? null;
}
