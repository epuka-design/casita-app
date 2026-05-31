import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { DIAS_SEMANA } from "@/lib/categorias";

// Modelo configurable; por defecto el Sonnet actual.
const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";

export interface RecetaMin {
  id: string;
  nombre: string;
  categoria: string | null;
}

export interface SugerenciaDia {
  dia: string;
  almuerzo_receta_id: string | null;
  cena_receta_id: string | null;
}

// Reglas de la familia (parte estática del prompt → se cachea).
const REGLAS = `Sos el asistente de cocina de la familia. Armás el menú semanal eligiendo platos del catálogo.

Reglas de la familia (respetalas al elegir):
- Al menos un día sin carne (sin carne roja, sin pollo y sin pescado).
- Si el almuerzo es pesado, la cena debe ser liviana.
- Nada de fideos ni pastas en la cena.
- Nada de sopa en la cena.
- Variá los platos a lo largo de la semana; evitá repetir.
- Elegí un almuerzo y una cena para los 7 días, de lunes a domingo.

Devolvé la propuesta llamando a la herramienta "proponer_menu", usando ÚNICAMENTE los id de receta del catálogo provisto.`;

const tool: Anthropic.Tool = {
  name: "proponer_menu",
  description: "Propone el menú completo de la semana (almuerzo y cena por día).",
  input_schema: {
    type: "object",
    properties: {
      dias: {
        type: "array",
        description: "Un elemento por día, de lunes a domingo.",
        items: {
          type: "object",
          properties: {
            dia: { type: "string", enum: [...DIAS_SEMANA] },
            almuerzo_receta_id: {
              type: "string",
              description: "id de receta del catálogo para el almuerzo",
            },
            cena_receta_id: {
              type: "string",
              description: "id de receta del catálogo para la cena",
            },
          },
          required: ["dia", "almuerzo_receta_id", "cena_receta_id"],
        },
      },
    },
    required: ["dias"],
  },
};

// Pide una sugerencia de menú a Claude. El catálogo de recetas se
// envía como bloque de sistema cacheado (cambia poco entre llamadas).
export async function sugerirMenu(
  recetas: RecetaMin[]
): Promise<SugerenciaDia[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("Falta configurar ANTHROPIC_API_KEY en el servidor.");
  }
  if (recetas.length === 0) {
    throw new Error("No hay recetas cargadas para sugerir un menú.");
  }

  const client = new Anthropic({ apiKey });
  const catalogo = recetas
    .map((r) => `${r.id} | ${r.nombre} | ${r.categoria ?? "-"}`)
    .join("\n");

  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 2048,
    thinking: { type: "disabled" },
    system: [
      { type: "text", text: REGLAS },
      {
        type: "text",
        text: `Catálogo de recetas disponibles (id | nombre | categoría):\n${catalogo}`,
        cache_control: { type: "ephemeral" },
      },
    ],
    tools: [tool],
    tool_choice: { type: "tool", name: "proponer_menu" },
    messages: [
      {
        role: "user",
        content: "Armá el menú de la semana respetando las reglas de la familia.",
      },
    ],
  });

  const block = res.content.find((b) => b.type === "tool_use");
  if (!block || block.type !== "tool_use") {
    throw new Error("La IA no devolvió una propuesta válida.");
  }

  const input = block.input as { dias?: SugerenciaDia[] };
  const validos = new Set(recetas.map((r) => r.id));
  const pick = (id: string | null | undefined) =>
    id && validos.has(id) ? id : null;

  return (input.dias ?? []).map((d) => ({
    dia: d.dia,
    almuerzo_receta_id: pick(d.almuerzo_receta_id),
    cena_receta_id: pick(d.cena_receta_id),
  }));
}
