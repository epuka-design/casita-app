"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireRole, ensureUser } from "@/lib/auth";
import { inicioSemana, DIAS_SEMANA } from "@/features/menu/logic";
import { CATEGORIAS_PLAN } from "@/lib/categorias";
import {
  extraerPlan,
  consolidarPlan,
  type ImagenPlan,
  type PlanData,
  type Consolidado,
} from "./ai";

export interface PreviewPlan {
  plan: PlanData;
  consolidado: Consolidado;
}
export type ProcesarResult =
  | { ok: true; preview: PreviewPlan }
  | { ok: false; error: string };
export type PlanResult = { ok: true } | { ok: false; error: string };

// Paso 1: leer las fotos y consolidar. NO guarda todavía (devuelve preview).
export async function procesarPlan(
  imagenes: ImagenPlan[]
): Promise<ProcesarResult> {
  await requireRole("admin");
  try {
    const plan = await extraerPlan(imagenes);
    const consolidado = await consolidarPlan(plan);
    return { ok: true, preview: { plan, consolidado } };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error de la IA" };
  }
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// Paso 2: confirmar → genera menú, recetas y lista del súper en Supabase.
export async function confirmarPlan(preview: PreviewPlan): Promise<PlanResult> {
  const user = await requireRole("admin");
  const semana = inicioSemana();
  const { plan, consolidado } = preview;

  // Mapa de adaptaciones por nombre de plato.
  const adapt = new Map(
    consolidado.adaptaciones.map((a) => [a.plato.trim().toLowerCase(), a.adaptacion])
  );

  // Cabecera del plan.
  const { data: planRow, error: ePlan } = await supabaseAdmin
    .from("planes_nutricionales")
    .insert({
      hogar_id: user.hogar_id,
      semana,
      datos_raw: preview,
      aprobado: true,
    })
    .select("id")
    .single();
  if (ePlan) return { ok: false, error: ePlan.message };
  const planId = planRow.id as string;

  // Receta a partir de un plato del plan; devuelve receta_id.
  async function guardarReceta(
    nombre: string,
    ingredientes1p: string[],
    preparacion: string,
    acompanamiento?: string
  ): Promise<string | null> {
    const nom = nombre.trim();
    if (!nom) return null;
    const instr = [preparacion, acompanamiento ? `Acompañamiento: ${acompanamiento}` : ""]
      .filter(Boolean)
      .join("\n");
    const { data, error } = await supabaseAdmin
      .from("recetas")
      .upsert(
        {
          hogar_id: user.hogar_id,
          nombre: nom,
          categoria: "Plan nutricional",
          ingredientes: (ingredientes1p ?? []).map((s) => ({ nombre: s, cantidad: "" })),
          instrucciones: instr,
          adaptacion_ninos: adapt.get(nom.toLowerCase()) ?? null,
          porciones: 1,
        },
        { onConflict: "hogar_id,nombre" }
      )
      .select("id")
      .single();
    if (error) return null;
    return data.id as string;
  }

  // Asegurar fila de la semana de menú.
  await supabaseAdmin
    .from("menu_semana")
    .upsert(
      { hogar_id: user.hogar_id, semana, creado_por: user.id },
      { onConflict: "hogar_id,semana", ignoreDuplicates: true }
    );

  // Menú + recetas: Día 1 → lunes, etc.
  const slots: {
    hogar_id: string;
    semana: string;
    dia: string;
    tipo: string;
    receta_id: string;
  }[] = [];
  for (let i = 0; i < plan.dias.length && i < DIAS_SEMANA.length; i++) {
    const d = plan.dias[i];
    const dia = DIAS_SEMANA[i];
    const idA = await guardarReceta(
      d.almuerzo.nombre,
      d.almuerzo.ingredientes_1p,
      d.almuerzo.preparacion,
      d.almuerzo.acompanamiento
    );
    const idC = await guardarReceta(
      d.cena.nombre,
      d.cena.ingredientes_1p,
      d.cena.preparacion,
      d.cena.acompanamiento
    );
    if (idA) slots.push({ hogar_id: user.hogar_id, semana, dia, tipo: "almuerzo", receta_id: idA });
    if (idC) slots.push({ hogar_id: user.hogar_id, semana, dia, tipo: "cena", receta_id: idC });
  }
  if (slots.length > 0) {
    await supabaseAdmin
      .from("menu_semanal")
      .upsert(slots, { onConflict: "hogar_id,semana,dia,tipo" });
  }

  // Menú aprobado (Yali ya revisó en la preview).
  await supabaseAdmin
    .from("menu_semana")
    .update({
      estado: "aprobado",
      aprobado_por: user.id,
      aprobado_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("hogar_id", user.hogar_id)
    .eq("semana", semana);

  // Lista del súper del plan.
  const ordenCat = new Map(CATEGORIAS_PLAN.map((c, i) => [c as string, i]));
  const items = consolidado.lista.map((it) => ({
    hogar_id: user.hogar_id,
    plan_id: planId,
    categoria: it.categoria,
    nombre: it.nombre,
    cantidad_total: it.cantidad_total,
    unidad: it.unidad,
    detalle: it.detalle,
    tildado: false,
    orden: (ordenCat.get(it.categoria) ?? 99) * 100,
  }));
  if (items.length > 0) {
    const { error: eItems } = await supabaseAdmin.from("lista_super_items").insert(items);
    if (eItems) return { ok: false, error: eItems.message };
  }

  revalidatePath("/plan");
  revalidatePath("/menu");
  revalidatePath("/recetas");
  return { ok: true };
}

// Tildar/destildar un item de la lista (cualquiera mientras compra).
export async function tildarItemPlan(
  id: string,
  tildado: boolean
): Promise<PlanResult> {
  await ensureUser();
  const { error } = await supabaseAdmin
    .from("lista_super_items")
    .update({ tildado })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/plan");
  return { ok: true };
}

export { cap };
