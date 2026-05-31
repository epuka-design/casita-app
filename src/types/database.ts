import type { Role } from "@/lib/roles";

// Tipos de las tablas de Supabase. Mantener en sync con
// supabase/migration.sql.

export interface UserRow {
  id: string;
  clerk_user_id: string;
  nombre: string;
  email: string;
  rol: Role;
  avatar_url: string | null;
  created_at: string;
}

export interface IngredienteReceta {
  nombre: string;
  cantidad: string;
}

export interface RecetaRow {
  id: string;
  nombre: string;
  categoria: string | null;
  ingredientes: IngredienteReceta[];
  instrucciones: string | null;
  porciones: number;
  created_at: string;
}

export interface MenuSemanalRow {
  id: string;
  semana: string; // date ISO (yyyy-mm-dd)
  dia: string;
  tipo: string; // desayuno | almuerzo | cena | snack
  receta_id: string | null;
  aprobado: boolean;
  created_at: string;
}

export interface ListaSuperRow {
  id: string;
  tipo: string | null;
  categoria: string | null;
  item: string;
  cantidad: string | null;
  tildado: boolean;
  fecha: string; // date ISO
  created_at: string;
}

export interface TareaRow {
  id: string;
  nombre: string;
  ciclo: string | null; // diaria | semanal | mensual
  categoria: string | null;
  orden: number;
}

export interface TareaCompletadaRow {
  id: string;
  tarea_id: string;
  fecha: string; // date ISO
  completada_por: string | null;
  created_at: string;
}
