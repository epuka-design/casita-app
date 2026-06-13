import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { CATEGORIAS_SUPER_SEMANAL } from "@/lib/categorias";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";

export interface PlatoSemana {
  dia: string;
  tipo: string; // almuerzo | cena
  nombre: string;
  porciones: number;
  ingredientes: { nombre: string; cantidad: string }[];
}

export interface ItemSemanal {
  categoria: string;
  nombre: string;
  cantidad_total: string;
  unidad: string;
  detalle: string;
}

const tool: Anthropic.Tool = {
  name: "lista_super",
  description: "Lista del súper consolidada para toda la semana.",
  input_schema: {
    type: "object",
    properties: {
      lista: {
        type: "array",
        items: {
          type: "object",
          properties: {
            categoria: { type: "string", enum: [...CATEGORIAS_SUPER_SEMANAL] },
            nombre: { type: "string" },
            cantidad_total: { type: "string", description: "número, ej '900'" },
            unidad: { type: "string", description: "g | kg | unidades | etc." },
            detalle: { type: "string", description: "de qué platos viene" },
          },
          required: ["categoria", "nombre", "cantidad_total", "unidad", "detalle"],
        },
      },
    },
    required: ["lista"],
  },
};

// Arma la lista del súper de la semana a partir del menú + el hogar.
// Robusto: infiere ingredientes de los platos que vienen solo con nombre.
export async function armarSuperSemanal(args: {
  platos: PlatoSemana[];
  objetivo: number;
  adultos: number;
  ninos: number;
}): Promise<ItemSemanal[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("Falta configurar ANTHROPIC_API_KEY en el servidor.");
  const client = new Anthropic({ apiKey });

  const system = `Sos asistente de compras del hogar. Te paso el menú de la semana (platos con sus ingredientes "por sus porciones") y el tamaño del hogar. Armá la lista del súper COMPLETA para toda la semana llamando a la herramienta "lista_super".

Hogar: ${args.adultos} adultos + ${args.ninos} niños = ${args.objetivo} porciones objetivo.

Reglas:
- Cada plato trae "porciones" y "ingredientes" para esas porciones. Escalá cada ingrediente a ${args.objetivo} porciones.
- Si un plato NO trae ingredientes (vino solo con el nombre), inferí los ingredientes típicos de ese plato casero rioplatense/paraguayo.
- Sumá los MISMOS ingredientes a lo largo de todos los platos de la semana.
- Convertí a unidades de compra reales: carnes y proteínas en g o kg; verduras en unidades o g.
- Agrupá en estas categorías EXACTAS: ${CATEGORIAS_SUPER_SEMANAL.join(", ")}.
- En "detalle" indicá brevemente de qué platos/días viene.
- No incluyas agua ni condimentos básicos (sal, pimienta) salvo que sean centrales.`;

  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 8000,
    thinking: { type: "disabled" },
    system,
    tools: [tool],
    tool_choice: { type: "tool", name: "lista_super" },
    messages: [{ role: "user", content: JSON.stringify(args.platos) }],
  });

  const block = res.content.find((b) => b.type === "tool_use");
  if (!block || block.type !== "tool_use") {
    throw new Error("No pude armar la lista del súper.");
  }
  const input = block.input as { lista?: ItemSemanal[] };
  return input.lista ?? [];
}
