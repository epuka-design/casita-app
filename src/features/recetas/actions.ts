"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth";
import { recetaSchema, type RecetaInput } from "@/lib/schemas";
import { generarReceta } from "./ai";

export type ActionResult = { ok: false; error: string } | { ok: true };

// Completa una receta (que está solo con el nombre) usando IA.
export async function completarReceta(id: string): Promise<ActionResult> {
  const user = await requireRole("admin");

  const { data: rec } = await supabaseAdmin
    .from("recetas")
    .select("nombre, categoria")
    .eq("id", id)
    .eq("hogar_id", user.hogar_id)
    .maybeSingle();
  if (!rec) return { ok: false, error: "Receta no encontrada." };

  let r;
  try {
    r = await generarReceta(rec.nombre as string, rec.categoria as string | null);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error de la IA" };
  }

  const { error } = await supabaseAdmin
    .from("recetas")
    .update({
      ingredientes: r.ingredientes,
      instrucciones: r.preparacion,
      porciones: r.porciones,
      tiempo_min: r.tiempo_min,
    })
    .eq("id", id)
    .eq("hogar_id", user.hogar_id);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/recetas/${id}`);
  revalidatePath("/recetas");
  return { ok: true };
}

function primerError(err: z.ZodError): string {
  return err.issues[0]?.message ?? "Datos inválidos";
}

// Crear receta. Devuelve error de validación; si todo ok, redirige.
export async function crearReceta(input: RecetaInput): Promise<ActionResult> {
  const user = await requireRole("admin");

  const parsed = recetaSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: primerError(parsed.error) };

  const { error } = await supabaseAdmin
    .from("recetas")
    .insert({ ...parsed.data, hogar_id: user.hogar_id });
  if (error) {
    if (error.code === "23505")
      return { ok: false, error: "Ya tenés una receta con ese nombre." };
    return { ok: false, error: error.message };
  }

  revalidatePath("/recetas");
  redirect("/recetas");
}

// Editar receta existente.
export async function editarReceta(
  id: string,
  input: RecetaInput
): Promise<ActionResult> {
  const user = await requireRole("admin");

  const parsed = recetaSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: primerError(parsed.error) };

  const { error } = await supabaseAdmin
    .from("recetas")
    .update(parsed.data)
    .eq("id", id)
    .eq("hogar_id", user.hogar_id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/recetas");
  revalidatePath(`/recetas/${id}`);
  redirect(`/recetas/${id}`);
}

// Eliminar receta.
export async function eliminarReceta(id: string): Promise<ActionResult> {
  const user = await requireRole("admin");

  const { error } = await supabaseAdmin
    .from("recetas")
    .delete()
    .eq("id", id)
    .eq("hogar_id", user.hogar_id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/recetas");
  redirect("/recetas");
}
