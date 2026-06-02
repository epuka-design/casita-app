import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { TareaRow } from "@/types/database";
import { hoy, tareaAplicaHoy, fechaLarga } from "./logic";

export interface TareaHoy {
  id: string;
  nombre: string;
  categoria: string | null;
  completada: boolean;
}

// Tareas que corresponden hoy para un usuario: las asignadas a él más
// las compartidas (sin responsable). Con su estado de completada.
export async function getTareasDeHoy(
  hogarId: string,
  userId: string
): Promise<{
  fechaLabel: string;
  tareas: TareaHoy[];
}> {
  const { iso, dia } = hoy();

  const { data, error } = await supabaseAdmin
    .from("tareas")
    .select("*")
    .eq("hogar_id", hogarId)
    .or(`asignado_a.is.null,asignado_a.eq.${userId}`)
    .order("orden", { ascending: true });
  if (error) throw new Error(error.message);

  const deHoy = (data as TareaRow[]).filter((t) =>
    tareaAplicaHoy(t.ciclo, dia)
  );

  // Qué tareas ya están tildadas hoy.
  let completas = new Set<string>();
  if (deHoy.length > 0) {
    const { data: comp, error: e2 } = await supabaseAdmin
      .from("tareas_completadas")
      .select("tarea_id")
      .eq("fecha", iso)
      .in(
        "tarea_id",
        deHoy.map((t) => t.id)
      );
    if (e2) throw new Error(e2.message);
    completas = new Set((comp ?? []).map((c) => c.tarea_id as string));
  }

  return {
    fechaLabel: fechaLarga(),
    tareas: deHoy.map((t) => ({
      id: t.id,
      nombre: t.nombre,
      categoria: t.categoria,
      completada: completas.has(t.id),
    })),
  };
}

// Catálogo completo de tareas del hogar (para gestión del admin).
export async function getTareasCatalogo(hogarId: string): Promise<TareaRow[]> {
  const { data, error } = await supabaseAdmin
    .from("tareas")
    .select("*")
    .eq("hogar_id", hogarId)
    .order("orden", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as TareaRow[];
}
