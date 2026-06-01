import { z } from "zod";

// ── Recetas ──────────────────────────────────────────────────────
export const ingredienteSchema = z.object({
  nombre: z.string().trim().min(1, "Falta el ingrediente").max(80),
  cantidad: z.string().trim().min(1, "Falta la cantidad").max(40),
});

// Tiempo en minutos: opcional. "" / null / undefined → null.
export const tiempoMinSchema = z.preprocess(
  (v) => (v === "" || v === undefined || v === null ? null : v),
  z.coerce
    .number()
    .int("El tiempo debe ser un número entero")
    .min(1, "Tiempo inválido")
    .max(1440, "Tiempo demasiado largo")
    .nullable()
);

export const recetaSchema = z.object({
  nombre: z.string().trim().min(1, "Poné un nombre").max(120),
  categoria: z.string().trim().min(1, "Elegí una categoría").max(40),
  porciones: z.coerce
    .number()
    .int("Tiene que ser un número entero")
    .min(1, "Mínimo 1 porción")
    .max(50),
  tiempo_min: tiempoMinSchema,
  instrucciones: z.string().trim().max(5000).default(""),
  // Opcional: se puede guardar una receta con solo nombre y categoría.
  ingredientes: z.array(ingredienteSchema).optional().default([]),
});

export type RecetaInput = z.input<typeof recetaSchema>;
export type RecetaParsed = z.output<typeof recetaSchema>;
