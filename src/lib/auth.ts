import "server-only";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "./supabase/admin";
import type { Role } from "./roles";
import type { UserRow } from "@/types/database";

// Sincroniza la identidad del usuario de Clerk con la tabla `users`
// (nombre, email, avatar). El rol y el hogar NO se tocan acá: los
// define el onboarding / el admin del hogar. Devuelve la fila.
export async function ensureUser(): Promise<UserRow> {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const email =
    user.primaryEmailAddress?.emailAddress ??
    user.emailAddresses[0]?.emailAddress ??
    "";
  const nombre =
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    user.username ||
    "Sin nombre";

  const { data, error } = await supabaseAdmin
    .from("users")
    .upsert(
      // Sólo campos de identidad → en conflicto, rol y hogar_id se preservan.
      { clerk_user_id: user.id, nombre, email, avatar_url: user.imageUrl },
      { onConflict: "clerk_user_id" }
    )
    .select()
    .single();

  if (error) {
    throw new Error(`No se pudo sincronizar el usuario: ${error.message}`);
  }
  return data as UserRow;
}

// Exige sesión + hogar asignado. Si el usuario todavía no tiene hogar,
// lo manda al onboarding (crear o unirse).
export async function requireHogar(): Promise<UserRow & { hogar_id: string }> {
  const user = await ensureUser();
  if (!user.hogar_id) redirect("/onboarding");
  return user as UserRow & { hogar_id: string };
}

// Exige uno de los roles permitidos dentro del hogar.
export async function requireRole(
  ...allowed: Role[]
): Promise<UserRow & { hogar_id: string }> {
  const user = await requireHogar();
  if (!allowed.includes(user.rol)) redirect("/dashboard");
  return user;
}
