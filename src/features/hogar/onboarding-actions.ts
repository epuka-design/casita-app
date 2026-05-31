"use server";

import { currentUser, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ensureUser } from "@/lib/auth";
import type { Role } from "@/lib/roles";

export type CrearResult =
  | { ok: true; codigo: string }
  | { ok: false; error: string };
export type UnirseResult = { ok: true } | { ok: false; error: string };

// Código de invitación tipo CASA-7Q3X (sin caracteres ambiguos).
function genCodigo(): string {
  const abc = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 4; i++) s += abc[Math.floor(Math.random() * abc.length)];
  return `CASA-${s}`;
}

// Refleja rol + hogar en Clerk (para el gating del middleware).
async function syncClerk(clerkId: string, rol: Role, hogarId: string) {
  const cc = await clerkClient();
  await cc.users.updateUserMetadata(clerkId, {
    publicMetadata: { rol, hogar_id: hogarId },
  });
}

// Crear un hogar nuevo: el usuario queda admin y se precargan los
// datos de ejemplo (recetas, tareas, items fijos, config).
export async function crearHogar(nombre: string): Promise<CrearResult> {
  const clerk = await currentUser();
  if (!clerk) return { ok: false, error: "Sesión no encontrada." };
  const user = await ensureUser();
  if (user.hogar_id) return { ok: true, codigo: "" }; // ya tiene hogar

  const limpio = nombre.trim();
  if (!limpio) return { ok: false, error: "Poné un nombre para tu hogar." };

  let hogarId = "";
  let codigo = "";
  for (let intento = 0; intento < 6; intento++) {
    codigo = genCodigo();
    const { data, error } = await supabaseAdmin
      .from("hogares")
      .insert({ nombre: limpio, codigo })
      .select("id")
      .single();
    if (!error && data) {
      hogarId = data.id as string;
      break;
    }
    if (error && error.code !== "23505") {
      return { ok: false, error: error.message };
    }
  }
  if (!hogarId)
    return { ok: false, error: "No se pudo generar el código, probá de nuevo." };

  // Precargar el hogar con datos de ejemplo.
  const { error: seedErr } = await supabaseAdmin.rpc("seed_hogar", { h: hogarId });
  if (seedErr) return { ok: false, error: seedErr.message };

  // El creador queda admin del hogar.
  const { error: upErr } = await supabaseAdmin
    .from("users")
    .update({ hogar_id: hogarId, rol: "admin" })
    .eq("id", user.id);
  if (upErr) return { ok: false, error: upErr.message };

  await syncClerk(clerk.id, "admin", hogarId);
  return { ok: true, codigo };
}

// Unirse a un hogar existente con el código de invitación.
export async function unirseHogar(codigo: string): Promise<UnirseResult> {
  const clerk = await currentUser();
  if (!clerk) return { ok: false, error: "Sesión no encontrada." };
  const user = await ensureUser();

  const code = codigo.trim().toUpperCase();
  if (!code) return { ok: false, error: "Pegá el código de invitación." };

  const { data: hogar, error } = await supabaseAdmin
    .from("hogares")
    .select("id")
    .eq("codigo", code)
    .maybeSingle();
  if (error) return { ok: false, error: error.message };
  if (!hogar) return { ok: false, error: "No encontramos ese código. Revisalo." };

  const { error: upErr } = await supabaseAdmin
    .from("users")
    .update({ hogar_id: hogar.id, rol: "familia" })
    .eq("id", user.id);
  if (upErr) return { ok: false, error: upErr.message };

  await syncClerk(clerk.id, "familia", hogar.id as string);
  return { ok: true };
}
