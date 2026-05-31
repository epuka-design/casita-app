import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { EstadoMenu } from "@/types/database";

export interface SuperItem {
  id: string;
  categoria: string;
  item: string;
  cantidad: string | null;
  tildado: boolean;
}

export interface ListaData {
  estado: EstadoMenu;
  items: SuperItem[];
}

export interface ItemFijo {
  id: string;
  categoria: string;
  item: string;
}

// Plantilla de items fijos mensuales (configurable desde admin).
export async function getItemsFijos(hogarId: string): Promise<ItemFijo[]> {
  const { data, error } = await supabaseAdmin
    .from("items_mensuales_fijos")
    .select("id, categoria, item")
    .eq("hogar_id", hogarId)
    .order("orden", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as ItemFijo[];
}

export async function getLista(
  hogarId: string,
  tipo: "mensual" | "semanal",
  periodo: string
): Promise<ListaData> {
  const [{ data: cab }, { data: items, error }] = await Promise.all([
    supabaseAdmin
      .from("lista_super_cab")
      .select("estado")
      .eq("hogar_id", hogarId)
      .eq("tipo", tipo)
      .eq("periodo", periodo)
      .maybeSingle(),
    supabaseAdmin
      .from("lista_super")
      .select("id, categoria, item, cantidad, tildado")
      .eq("hogar_id", hogarId)
      .eq("tipo", tipo)
      .eq("periodo", periodo)
      .order("orden", { ascending: true })
      .order("item", { ascending: true }),
  ]);
  if (error) throw new Error(error.message);

  return {
    estado: (cab?.estado as EstadoMenu) ?? "borrador",
    items: (items ?? []) as SuperItem[],
  };
}
