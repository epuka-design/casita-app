"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth";
import { syncClerkMetadata } from "@/lib/clerk-sync";
import { ROLES, type Role } from "@/lib/roles";

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

// Cambiar el rol de un miembro del hogar (solo admin, no a uno mismo).
export async function cambiarRol(
  miembroId: string,
  nuevoRol: Role
): Promise<HogarResult> {
  const admin = await requireRole("admin");
  if (!ROLES.includes(nuevoRol))
    return { ok: false, error: "Rol inválido." };
  if (miembroId === admin.id)
    return { ok: false, error: "No podés cambiar tu propio rol." };

  // El miembro tiene que ser del mismo hogar.
  const { data: miembro } = await supabaseAdmin
    .from("users")
    .select("clerk_user_id")
    .eq("id", miembroId)
    .eq("hogar_id", admin.hogar_id)
    .maybeSingle();
  if (!miembro) return { ok: false, error: "Ese miembro no es de tu hogar." };

  const { error } = await supabaseAdmin
    .from("users")
    .update({ rol: nuevoRol })
    .eq("id", miembroId)
    .eq("hogar_id", admin.hogar_id);
  if (error) return { ok: false, error: error.message };

  await syncClerkMetadata(
    miembro.clerk_user_id as string,
    nuevoRol,
    admin.hogar_id
  );
  revalidatePath("/admin");
  return { ok: true };
}

// Sacar a un miembro del hogar (solo admin, no a uno mismo).
export async function quitarMiembro(miembroId: string): Promise<HogarResult> {
  const admin = await requireRole("admin");
  if (miembroId === admin.id)
    return { ok: false, error: "No podés sacarte a vos mismo." };

  const { data: miembro } = await supabaseAdmin
    .from("users")
    .select("clerk_user_id")
    .eq("id", miembroId)
    .eq("hogar_id", admin.hogar_id)
    .maybeSingle();
  if (!miembro) return { ok: false, error: "Ese miembro no es de tu hogar." };

  const { error } = await supabaseAdmin
    .from("users")
    .update({ hogar_id: null, rol: "familia" })
    .eq("id", miembroId)
    .eq("hogar_id", admin.hogar_id);
  if (error) return { ok: false, error: error.message };

  // Queda sin hogar → al volver, irá al onboarding.
  await syncClerkMetadata(miembro.clerk_user_id as string, "familia", null);
  revalidatePath("/admin");
  return { ok: true };
}
