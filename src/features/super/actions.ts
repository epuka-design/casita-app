"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireRole, requireHogar } from "@/lib/auth";
import { getHogar } from "@/lib/hogar";
import { getRecetas } from "@/features/recetas/queries";
import { generarReceta } from "@/features/recetas/ai";
import { escalarCantidad, combinarCantidades } from "@/lib/cantidades";
import { categorizarIngrediente } from "./categorizar";
import {
  CATEGORIAS_SUPER_SEMANAL,
  CATEGORIAS_SUPER_MENSUAL,
} from "@/lib/categorias";
import type { EstadoMenu, RecetaRow } from "@/types/database";
import type { Role } from "@/lib/roles";

export type SuperResult = { ok: true } | { ok: false; error: string };
type Tipo = "mensual" | "semanal";

// Admin edita todo; ayudante solo el semanal (el mensual lo arma admin).
function puedeEditar(rol: Role, tipo: Tipo): boolean {
  return rol === "admin" || (rol === "ayudante" && tipo === "semanal");
}

function ordenCategoria(tipo: Tipo, categoria: string): number {
  const arr =
    tipo === "semanal" ? CATEGORIAS_SUPER_SEMANAL : CATEGORIAS_SUPER_MENSUAL;
  const idx = (arr as readonly string[]).indexOf(categoria);
  return (idx < 0 ? 90 : idx) * 100;
}

async function asegurarCab(
  hogarId: string,
  tipo: Tipo,
  periodo: string,
  generadoPor?: string
) {
  const { error } = await supabaseAdmin
    .from("lista_super_cab")
    .upsert(
      { hogar_id: hogarId, tipo, periodo, generado_por: generadoPor ?? null },
      { onConflict: "hogar_id,tipo,periodo", ignoreDuplicates: true }
    );
  if (error) throw new Error(error.message);
}

async function setEstado(
  hogarId: string,
  tipo: Tipo,
  periodo: string,
  estado: EstadoMenu,
  extra: object = {}
) {
  const { error } = await supabaseAdmin
    .from("lista_super_cab")
    .update({ estado, updated_at: new Date().toISOString(), ...extra })
    .eq("hogar_id", hogarId)
    .eq("tipo", tipo)
    .eq("periodo", periodo);
  if (error) throw new Error(error.message);
}

async function getEstado(
  hogarId: string,
  tipo: Tipo,
  periodo: string
): Promise<EstadoMenu | null> {
  const { data } = await supabaseAdmin
    .from("lista_super_cab")
    .select("estado")
    .eq("hogar_id", hogarId)
    .eq("tipo", tipo)
    .eq("periodo", periodo)
    .maybeSingle();
  return (data?.estado as EstadoMenu) ?? null;
}

// ── Generación MENSUAL (desde la plantilla de items fijos) ───────
export async function generarMensual(periodo: string): Promise<SuperResult> {
  const user = await requireRole("admin");

  const { data: fijos, error } = await supabaseAdmin
    .from("items_mensuales_fijos")
    .select("categoria, item, orden")
    .eq("hogar_id", user.hogar_id)
    .order("orden");
  if (error) return { ok: false, error: error.message };

  await asegurarCab(user.hogar_id, "mensual", periodo, user.id);
  await supabaseAdmin
    .from("lista_super")
    .delete()
    .eq("hogar_id", user.hogar_id)
    .eq("tipo", "mensual")
    .eq("periodo", periodo);

  const rows = (fijos ?? []).map((f) => ({
    hogar_id: user.hogar_id,
    tipo: "mensual",
    periodo,
    categoria: f.categoria,
    item: f.item,
    cantidad: null,
    tildado: false,
    orden: f.orden,
  }));
  if (rows.length > 0) {
    const { error: e2 } = await supabaseAdmin.from("lista_super").insert(rows);
    if (e2) return { ok: false, error: e2.message };
  }

  await setEstado(user.hogar_id, "mensual", periodo, "borrador");
  revalidatePath("/super");
  return { ok: true };
}

// ── Generación SEMANAL (desde el menú aprobado, escalando) ───────
export async function generarSemanal(periodo: string): Promise<SuperResult> {
  const user = await requireRole("admin", "ayudante");

  // El menú de la semana tiene que estar aprobado.
  const { data: menuCab } = await supabaseAdmin
    .from("menu_semana")
    .select("estado")
    .eq("hogar_id", user.hogar_id)
    .eq("semana", periodo)
    .maybeSingle();
  if (menuCab?.estado !== "aprobado") {
    return {
      ok: false,
      error: "Primero aprobá el menú de la semana para generar el súper.",
    };
  }

  const [{ data: slots }, recetas, hogar] = await Promise.all([
    supabaseAdmin
      .from("menu_semanal")
      .select("receta_id")
      .eq("hogar_id", user.hogar_id)
      .eq("semana", periodo),
    getRecetas(user.hogar_id),
    getHogar(user.hogar_id),
  ]);

  const porId = new Map<string, RecetaRow>(recetas.map((r) => [r.id, r]));

  // Completar con IA las recetas del menú que están solo con el nombre,
  // así la lista del súper sí puede armarse.
  const idsMenu = Array.from(
    new Set((slots ?? []).map((s) => s.receta_id as string).filter(Boolean))
  );
  for (const id of idsMenu) {
    const r = porId.get(id);
    if (!r || (r.ingredientes && r.ingredientes.length > 0)) continue;
    try {
      const gen = await generarReceta(r.nombre, r.categoria);
      if (gen.ingredientes.length > 0) {
        await supabaseAdmin
          .from("recetas")
          .update({
            ingredientes: gen.ingredientes,
            instrucciones: gen.preparacion,
            porciones: gen.porciones,
            tiempo_min: gen.tiempo_min,
          })
          .eq("id", id)
          .eq("hogar_id", user.hogar_id);
        porId.set(id, {
          ...r,
          ingredientes: gen.ingredientes,
          porciones: gen.porciones,
        });
      }
    } catch {
      // Si una receta falla, seguimos con las demás.
    }
  }

  // Acumular ingredientes escalados por receta y agrupados por nombre.
  const acc = new Map<
    string,
    { nombre: string; categoria: string; cantidades: string[] }
  >();
  for (const s of slots ?? []) {
    const r = s.receta_id ? porId.get(s.receta_id as string) : undefined;
    if (!r) continue;
    const factor = r.porciones > 0 ? hogar.objetivo / r.porciones : 1;
    for (const ing of r.ingredientes ?? []) {
      const nombre = (ing.nombre ?? "").trim();
      if (!nombre) continue;
      const key = nombre.toLowerCase();
      const escal = escalarCantidad(ing.cantidad, factor);
      const cur =
        acc.get(key) ??
        { nombre, categoria: categorizarIngrediente(nombre), cantidades: [] };
      if (escal) cur.cantidades.push(escal);
      acc.set(key, cur);
    }
  }

  await asegurarCab(user.hogar_id, "semanal", periodo, user.id);
  await supabaseAdmin
    .from("lista_super")
    .delete()
    .eq("hogar_id", user.hogar_id)
    .eq("tipo", "semanal")
    .eq("periodo", periodo);

  const rows = Array.from(acc.values()).map((v) => ({
    hogar_id: user.hogar_id,
    tipo: "semanal",
    periodo,
    categoria: v.categoria,
    item: v.nombre,
    cantidad: combinarCantidades(v.cantidades) || null,
    tildado: false,
    orden: ordenCategoria("semanal", v.categoria),
  }));
  if (rows.length > 0) {
    const { error } = await supabaseAdmin.from("lista_super").insert(rows);
    if (error) return { ok: false, error: error.message };
  }

  await setEstado(user.hogar_id, "semanal", periodo, "borrador");
  revalidatePath("/super");
  return { ok: true };
}

// ── Edición de items ─────────────────────────────────────────────
export async function agregarItem(
  tipo: Tipo,
  periodo: string,
  categoria: string,
  item: string,
  cantidad: string
): Promise<SuperResult> {
  const user = await requireRole("admin", "ayudante");
  if (!puedeEditar(user.rol, tipo))
    return { ok: false, error: "No tenés permiso para editar esta lista." };
  const nombre = item.trim();
  if (!nombre) return { ok: false, error: "Escribí el nombre del item." };

  await asegurarCab(user.hogar_id, tipo, periodo, user.id);
  const { error } = await supabaseAdmin.from("lista_super").insert({
    hogar_id: user.hogar_id,
    tipo,
    periodo,
    categoria,
    item: nombre,
    cantidad: cantidad.trim() || null,
    tildado: false,
    orden: ordenCategoria(tipo, categoria) + 90,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/super");
  return { ok: true };
}

export async function actualizarCantidad(
  id: string,
  tipo: Tipo,
  cantidad: string
): Promise<SuperResult> {
  const user = await requireRole("admin", "ayudante");
  if (!puedeEditar(user.rol, tipo))
    return { ok: false, error: "No tenés permiso para editar esta lista." };

  const { error } = await supabaseAdmin
    .from("lista_super")
    .update({ cantidad: cantidad.trim() || null })
    .eq("id", id)
    .eq("hogar_id", user.hogar_id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/super");
  return { ok: true };
}

export async function quitarItem(id: string, tipo: Tipo): Promise<SuperResult> {
  const user = await requireRole("admin", "ayudante");
  if (!puedeEditar(user.rol, tipo))
    return { ok: false, error: "No tenés permiso para editar esta lista." };

  const { error } = await supabaseAdmin
    .from("lista_super")
    .delete()
    .eq("id", id)
    .eq("hogar_id", user.hogar_id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/super");
  return { ok: true };
}

// Tildar/destildar mientras se compra: cualquier rol del hogar.
export async function tildarItem(
  id: string,
  tildado: boolean
): Promise<SuperResult> {
  const user = await requireHogar();
  const { error } = await supabaseAdmin
    .from("lista_super")
    .update({ tildado })
    .eq("id", id)
    .eq("hogar_id", user.hogar_id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/super");
  return { ok: true };
}

// ── Flujo de aprobación ──────────────────────────────────────────
export async function enviarAprobacionSuper(
  tipo: Tipo,
  periodo: string
): Promise<SuperResult> {
  const user = await requireRole("admin", "ayudante");
  if (!puedeEditar(user.rol, tipo))
    return { ok: false, error: "No tenés permiso." };
  await asegurarCab(user.hogar_id, tipo, periodo, user.id);
  await setEstado(user.hogar_id, tipo, periodo, "pendiente");
  revalidatePath("/super");
  return { ok: true };
}

export async function aprobarSuper(
  tipo: Tipo,
  periodo: string
): Promise<SuperResult> {
  const user = await requireRole("admin");
  await asegurarCab(user.hogar_id, tipo, periodo, user.id);
  await setEstado(user.hogar_id, tipo, periodo, "aprobado", {
    aprobado_por: user.id,
    aprobado_at: new Date().toISOString(),
  });
  revalidatePath("/super");
  return { ok: true };
}

export async function reabrirSuper(
  tipo: Tipo,
  periodo: string
): Promise<SuperResult> {
  const user = await requireRole("admin");
  await setEstado(user.hogar_id, tipo, periodo, "borrador", {
    aprobado_por: null,
    aprobado_at: null,
  });
  revalidatePath("/super");
  return { ok: true };
}

// ── Plantilla de items fijos mensuales (config admin) ────────────
export async function agregarFijo(
  categoria: string,
  item: string
): Promise<SuperResult> {
  const user = await requireRole("admin");
  const nombre = item.trim();
  if (!nombre) return { ok: false, error: "Escribí el nombre del item." };

  const { error } = await supabaseAdmin
    .from("items_mensuales_fijos")
    .insert({ hogar_id: user.hogar_id, categoria, item: nombre, orden: 999 });
  if (error) {
    if (error.code === "23505")
      return { ok: false, error: "Ese item ya está en la plantilla." };
    return { ok: false, error: error.message };
  }
  revalidatePath("/admin");
  return { ok: true };
}

export async function quitarFijo(id: string): Promise<SuperResult> {
  const user = await requireRole("admin");
  const { error } = await supabaseAdmin
    .from("items_mensuales_fijos")
    .delete()
    .eq("id", id)
    .eq("hogar_id", user.hogar_id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin");
  return { ok: true };
}

export { getEstado as getEstadoSuper };
