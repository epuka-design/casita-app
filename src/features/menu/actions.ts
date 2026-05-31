"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth";
import { getRecetas } from "@/features/recetas/queries";
import { getEstadoSemana } from "./queries";
import { sugerirMenu } from "./ai";
import type { EstadoMenu } from "@/types/database";

export type MenuResult = { ok: true } | { ok: false; error: string };

// Crea la fila de la semana si no existe (estado borrador).
async function asegurarSemana(hogarId: string, semana: string, creadoPor?: string) {
  const { error } = await supabaseAdmin
    .from("menu_semana")
    .upsert(
      { hogar_id: hogarId, semana, creado_por: creadoPor ?? null },
      { onConflict: "hogar_id,semana", ignoreDuplicates: true }
    );
  if (error) throw new Error(error.message);
}

async function setEstado(
  hogarId: string,
  semana: string,
  estado: EstadoMenu,
  extra: object = {}
) {
  const { error } = await supabaseAdmin
    .from("menu_semana")
    .update({ estado, updated_at: new Date().toISOString(), ...extra })
    .eq("hogar_id", hogarId)
    .eq("semana", semana);
  if (error) throw new Error(error.message);
}

// Asigna o quita un plato (almuerzo/cena) de un día.
export async function setPlato(
  semana: string,
  dia: string,
  tipo: string,
  recetaId: string | null
): Promise<MenuResult> {
  const user = await requireRole("admin", "ayudante");

  const estado = await getEstadoSemana(user.hogar_id, semana);
  if (user.rol === "ayudante" && estado === "aprobado") {
    return { ok: false, error: "El menú ya fue aprobado; no se puede editar." };
  }

  await asegurarSemana(user.hogar_id, semana, user.id);

  if (recetaId) {
    const { error } = await supabaseAdmin
      .from("menu_semanal")
      .upsert(
        { hogar_id: user.hogar_id, semana, dia, tipo, receta_id: recetaId },
        { onConflict: "hogar_id,semana,dia,tipo" }
      );
    if (error) return { ok: false, error: error.message };
  } else {
    const { error } = await supabaseAdmin
      .from("menu_semanal")
      .delete()
      .eq("hogar_id", user.hogar_id)
      .eq("semana", semana)
      .eq("dia", dia)
      .eq("tipo", tipo);
    if (error) return { ok: false, error: error.message };
  }

  revalidatePath("/menu");
  return { ok: true };
}

// Envía el menú a aprobación.
export async function enviarAprobacion(semana: string): Promise<MenuResult> {
  const user = await requireRole("admin", "ayudante");
  await asegurarSemana(user.hogar_id, semana, user.id);
  await setEstado(user.hogar_id, semana, "pendiente");
  revalidatePath("/menu");
  return { ok: true };
}

// Aprueba el menú (solo admin).
export async function aprobarMenu(semana: string): Promise<MenuResult> {
  const user = await requireRole("admin");
  await asegurarSemana(user.hogar_id, semana, user.id);
  await setEstado(user.hogar_id, semana, "aprobado", {
    aprobado_por: user.id,
    aprobado_at: new Date().toISOString(),
  });
  revalidatePath("/menu");
  return { ok: true };
}

// Reabre un menú aprobado para editarlo (solo admin).
export async function reabrirMenu(semana: string): Promise<MenuResult> {
  const user = await requireRole("admin");
  await setEstado(user.hogar_id, semana, "borrador", {
    aprobado_por: null,
    aprobado_at: null,
  });
  revalidatePath("/menu");
  return { ok: true };
}

// Pide una sugerencia a la IA y la vuelca en la semana (deja en borrador).
export async function sugerirMenuAction(semana: string): Promise<MenuResult> {
  const user = await requireRole("admin", "ayudante");

  const estado = await getEstadoSemana(user.hogar_id, semana);
  if (user.rol === "ayudante" && estado === "aprobado") {
    return { ok: false, error: "El menú ya fue aprobado; no se puede editar." };
  }

  const recetas = (await getRecetas(user.hogar_id)).map((r) => ({
    id: r.id,
    nombre: r.nombre,
    categoria: r.categoria,
  }));

  let dias;
  try {
    dias = await sugerirMenu(recetas);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error de la IA" };
  }

  await asegurarSemana(user.hogar_id, semana, user.id);

  const rows: {
    hogar_id: string;
    semana: string;
    dia: string;
    tipo: string;
    receta_id: string;
  }[] = [];
  for (const d of dias) {
    if (d.almuerzo_receta_id)
      rows.push({ hogar_id: user.hogar_id, semana, dia: d.dia, tipo: "almuerzo", receta_id: d.almuerzo_receta_id });
    if (d.cena_receta_id)
      rows.push({ hogar_id: user.hogar_id, semana, dia: d.dia, tipo: "cena", receta_id: d.cena_receta_id });
  }

  if (rows.length > 0) {
    const { error } = await supabaseAdmin
      .from("menu_semanal")
      .upsert(rows, { onConflict: "hogar_id,semana,dia,tipo" });
    if (error) return { ok: false, error: error.message };
  }

  await setEstado(user.hogar_id, semana, "borrador");
  revalidatePath("/menu");
  return { ok: true };
}
