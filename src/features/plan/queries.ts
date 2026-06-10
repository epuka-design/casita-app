import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { PlanNutricionalRow, ListaSuperItemRow } from "@/types/database";

export async function getPlanActual(hogarId: string): Promise<{
  plan: PlanNutricionalRow | null;
  items: ListaSuperItemRow[];
}> {
  const { data: plan } = await supabaseAdmin
    .from("planes_nutricionales")
    .select("*")
    .eq("hogar_id", hogarId)
    .eq("aprobado", true)
    .order("fecha_carga", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!plan) return { plan: null, items: [] };

  const { data: items, error } = await supabaseAdmin
    .from("lista_super_items")
    .select("*")
    .eq("plan_id", plan.id)
    .order("orden", { ascending: true })
    .order("nombre", { ascending: true });
  if (error) throw new Error(error.message);

  return {
    plan: plan as PlanNutricionalRow,
    items: (items ?? []) as ListaSuperItemRow[],
  };
}
