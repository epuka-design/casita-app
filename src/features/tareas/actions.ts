"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireHogar } from "@/lib/auth";
import { hoy } from "./logic";

export type ToggleResult = { ok: true } | { ok: false; error: string };

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
