import "server-only";
import Anthropic from "@anthropic-ai/sdk";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";

export interface RecetaGenerada {
  ingredientes: { nombre: string; cantidad: string }[];
  preparacion: string;
  porciones: number;
  tiempo_min: number | null;
}

const tool: Anthropic.Tool = {
  name: "receta",
  description: "Devuelve una receta casera con ingredientes y preparación.",
  input_schema: {
    type: "object",
    properties: {
      porciones: { type: "integer", description: "para cuántas porciones rinde" },
      tiempo_min: { type: "integer", description: "tiempo estimado en minutos" },
      ingredientes: {
        type: "array",
        items: {
          type: "object",
          properties: {
            nombre: { type: "string" },
            cantidad: { type: "string", description: "ej. '500 g', '2', '1 taza'" },
          },
          required: ["nombre", "cantidad"],
        },
      },
      preparacion: { type: "string", description: "pasos, uno por línea" },
    },
    required: ["porciones", "ingredientes", "preparacion"],
  },
};

const SYSTEM = `Sos cocinero/a de casa (cocina rioplatense/paraguaya). Te dan el nombre de un plato y devolvés una receta casera realista llamando a la herramienta "receta".
- Ingredientes con cantidades concretas para la cantidad de porciones que elijas (4 si no hay motivo para otra).
- Preparación clara, un paso por línea.
- Castellano rioplatense, sencillo.`;

// Genera una receta a partir del nombre del plato (conocimiento de Claude).
export async function generarReceta(
  nombre: string,
  categoria?: string | null
): Promise<RecetaGenerada> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("Falta configurar ANTHROPIC_API_KEY en el servidor.");
  const client = new Anthropic({ apiKey });

  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 2048,
    thinking: { type: "disabled" },
    system: SYSTEM,
    tools: [tool],
    tool_choice: { type: "tool", name: "receta" },
    messages: [
      {
        role: "user",
        content: `Plato: ${nombre}${categoria ? ` (categoría: ${categoria})` : ""}`,
      },
    ],
  });

  const block = res.content.find((b) => b.type === "tool_use");
  if (!block || block.type !== "tool_use") {
    throw new Error("No pude generar la receta.");
  }
  const input = block.input as {
    porciones?: number;
    tiempo_min?: number;
    ingredientes?: { nombre: string; cantidad: string }[];
    preparacion?: string;
  };
  return {
    ingredientes: input.ingredientes ?? [],
    preparacion: input.preparacion ?? "",
    porciones: input.porciones && input.porciones > 0 ? input.porciones : 4,
    tiempo_min: input.tiempo_min ?? null,
  };
}
