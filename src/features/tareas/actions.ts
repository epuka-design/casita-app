"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireHogar, requireRole } from "@/lib/auth";
import { hoy } from "./logic";

export type ToggleResult = { ok: true } | { ok: false; error: string };
export type TareaResult = { ok: true } | { ok: false; error: string };

export interface TareaInput {
  nombre: string;
  ciclo: string;
  categoria: string;
  asignado_a: string | null;
}

// Crear una tarea en el catálogo (solo admin).
export async function crearTarea(input: TareaInput): Promise<TareaResult> {
  const user = await requireRole("admin");
  const nombre = input.nombre.trim();
  if (!nombre) return { ok: false, error: "Escribí el nombre de la tarea." };

  const { error } = await supabaseAdmin.from("tareas").insert({
    hogar_id: user.hogar_id,
    nombre,
    ciclo: input.ciclo,
    categoria: input.categoria,
    asignado_a: input.asignado_a,
    orden: 999,
  });
  if (error) {
    if (error.code === "23505")
      return { ok: false, error: "Ya existe una tarea con ese nombre." };
    return { ok: false, error: error.message };
  }
  revalidatePath("/tareas/gestionar");
  revalidatePath("/tareas");
  return { ok: true };
}

// Editar una tarea (nombre, ciclo, categoría, responsable). Solo admin.
export async function editarTarea(
  id: string,
  campos: Partial<TareaInput>
): Promise<TareaResult> {
  const user = await requireRole("admin");
  const patch: Record<string, unknown> = {};
  if (campos.nombre !== undefined) {
    const n = campos.nombre.trim();
    if (!n) return { ok: false, error: "El nombre no puede quedar vacío." };
    patch.nombre = n;
  }
  if (campos.ciclo !== undefined) patch.ciclo = campos.ciclo;
  if (campos.categoria !== undefined) patch.categoria = campos.categoria;
  if (campos.asignado_a !== undefined) patch.asignado_a = campos.asignado_a;

  const { error } = await supabaseAdmin
    .from("tareas")
    .update(patch)
    .eq("id", id)
    .eq("hogar_id", user.hogar_id);
  if (error) {
    if (error.code === "23505")
      return { ok: false, error: "Ya existe una tarea con ese nombre." };
    return { ok: false, error: error.message };
  }
  revalidatePath("/tareas/gestionar");
  revalidatePath("/tareas");
  return { ok: true };
}

// Borrar una tarea del catálogo (solo admin).
export async function eliminarTarea(id: string): Promise<TareaResult> {
  const user = await requireRole("admin");
  const { error } = await supabaseAdmin
    .from("tareas")
    .delete()
    .eq("id", id)
    .eq("hogar_id", user.hogar_id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/tareas/gestionar");
  revalidatePath("/tareas");
  return { ok: true };
}

// Tilda / destilda una tarea para hoy. Cualquier rol puede hacerlo;
// queda registrado quién y cuándo en tareas_completadas.
export async function toggleTarea(
  tareaId: string,
  completar: boolean
): Promise<ToggleResult> {
  const user = await requireHogar();
  const { iso } = hoy();

  if (completar) {
    const { error } = await supabaseAdmin.from("tareas_completadas").upsert(
      {
        hogar_id: user.hogar_id,
        tarea_id: tareaId,
        fecha: iso,
        completada_por: user.id,
      },
      { onConflict: "tarea_id,fecha" }
    );
    if (error) return { ok: false, error: error.message };
  } else {
    const { error } = await supabaseAdmin
      .from("tareas_completadas")
      .delete()
      .eq("tarea_id", tareaId)
      .eq("fecha", iso);
    if (error) return { ok: false, error: error.message };
  }

  revalidatePath("/tareas");
  return { ok: true };
}
