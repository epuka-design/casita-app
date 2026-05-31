"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth";

export type HogarResult = { ok: true } | { ok: false; error: string };

const hogarSchema = z.object({
  adultos: z.coerce.number().int().min(1, "Al menos 1 adulto").max(20),
  ninos: z.coerce.number().int().min(0).max(20),
});

export async function setHogar(input: {
  adultos: number;
  ninos: number;
}): Promise<HogarResult> {
  const user = await requireRole("admin");

  const parsed = hogarSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const { error } = await supabaseAdmin
    .from("hogar_config")
    .update({
      adultos: parsed.data.adultos,
      ninos: parsed.data.ninos,
      updated_at: new Date().toISOString(),
    })
    .eq("hogar_id", user.hogar_id);
  if (error) return { ok: false, error: error.message };

  // Afecta recetas (objetivo) y, a futuro, la lista del súper.
  revalidatePath("/admin");
  revalidatePath("/recetas", "layout");
  return { ok: true };
}
