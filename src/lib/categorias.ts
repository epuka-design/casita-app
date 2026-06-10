// Categorías fijas (editables acá). Compartidas por recetas y súper.

export const CATEGORIAS_RECETA = [
  "Fit/Saludable",
  "Casero Paraguayo",
  "Carnes",
  "Pollo",
  "Pastas",
  "Tartas",
] as const;

export type CategoriaReceta = (typeof CATEGORIAS_RECETA)[number];

// Lista del súper MENSUAL (items fijos configurables).
export const CATEGORIAS_SUPER_MENSUAL = [
  "Limpieza",
  "Aseo personal",
  "Despensa base",
  "Bebidas",
] as const;

// Lista del súper SEMANAL (autogenerada desde el menú).
export const CATEGORIAS_SUPER_SEMANAL = [
  "Carnes y proteínas",
  "Verduras",
  "Lácteos",
  "Frutas",
  "Despensa",
  "Panadería",
] as const;

export type CategoriaMensual = (typeof CATEGORIAS_SUPER_MENSUAL)[number];
export type CategoriaSemanal = (typeof CATEGORIAS_SUPER_SEMANAL)[number];

// Lista del súper del Plan Nutricional (orden: carnes primero).
export const CATEGORIAS_PLAN = [
  "Carnes y proteínas",
  "Verduras y hojas",
  "Tomates y locotes",
  "Cebollas y aromáticas",
  "Frutas",
  "Lácteos y huevos",
  "Enlatados",
  "Panadería",
  "Despensa",
] as const;
export type CategoriaPlan = (typeof CATEGORIAS_PLAN)[number];

export const TIPOS_COMIDA = [
  "desayuno",
  "almuerzo",
  "merienda",
  "cena",
] as const;

// Tipos de comida que se planifican en el menú semanal.
export const MENU_TIPOS = ["almuerzo", "cena"] as const;
export type MenuTipo = (typeof MENU_TIPOS)[number];

export const MENU_TIPO_LABEL: Record<MenuTipo, string> = {
  almuerzo: "Almuerzo",
  cena: "Cena",
};

export const DIAS_SEMANA = [
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
  "domingo",
] as const;

export type DiaSemana = (typeof DIAS_SEMANA)[number];
export type TipoComida = (typeof TIPOS_COMIDA)[number];

// ── Tareas del hogar ─────────────────────────────────────────────
export const CICLOS_TAREA = ["diaria", "quincenal", "mensual"] as const;
export const CATEGORIAS_TAREA = ["cocina", "limpieza", "niños", "ropa"] as const;

export type CicloTarea = (typeof CICLOS_TAREA)[number];
export type CategoriaTarea = (typeof CATEGORIAS_TAREA)[number];
