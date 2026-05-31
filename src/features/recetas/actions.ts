"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth";
import { recetaSchema, type RecetaInput } from "@/lib/schemas";

export type ActionResult = { ok: false; error: string } | { ok: true };

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
  if (error) return { ok: false, error: error.message };

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
