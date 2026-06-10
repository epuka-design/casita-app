import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { CATEGORIAS_PLAN } from "@/lib/categorias";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";

export interface PlanComida {
  nombre: string;
  ingredientes_1p: string[];
  preparacion: string;
  acompanamiento?: string;
}
export interface PlanDia {
  dia: string;
  almuerzo: PlanComida;
  cena: PlanComida;
}
export interface PlanData {
  indicaciones_generales?: {
    desayuno?: string;
    media_manana?: string;
    merienda?: string;
    libre?: string;
  };
  dias: PlanDia[];
  permitidos?: string[];
  ensaladas_base?: string[];
  bebidas?: string[];
}

export interface ImagenPlan {
  media_type: string;
  data: string; // base64 sin prefijo
}

export interface ItemListaPlan {
  categoria: string;
  nombre: string;
  cantidad_total: string;
  unidad: string;
  detalle: string;
}
export interface AdaptacionPlato {
  plato: string;
  adaptacion: string;
}
export interface Consolidado {
  lista: ItemListaPlan[];
  adaptaciones: AdaptacionPlato[];
}

const SYSTEM_EXTRACCION = `Sos un asistente de nutrición y planificación del hogar.
Analizá las imágenes del plan nutricional y extraé toda la información en formato JSON.

Devolvé SOLO JSON válido, sin texto adicional, sin backticks.

Formato esperado:
{
  "indicaciones_generales": {
    "desayuno": "...",
    "media_manana": "...",
    "merienda": "...",
    "libre": "..."
  },
  "dias": [
    {
      "dia": "Día 1",
      "almuerzo": {
        "nombre": "...",
        "ingredientes_1p": ["..."],
        "preparacion": "...",
        "acompanamiento": "..."
      },
      "cena": {
        "nombre": "...",
        "ingredientes_1p": ["..."],
        "preparacion": "...",
        "acompanamiento": "..."
      }
    }
  ],
  "permitidos": ["..."],
  "ensaladas_base": ["..."],
  "bebidas": ["..."]
}`;

function client(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("Falta configurar ANTHROPIC_API_KEY en el servidor.");
  return new Anthropic({ apiKey });
}

function parseJSON<T>(texto: string): T {
  let t = texto.trim();
  // Quitar fences si vinieran.
  t = t.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  const i = t.indexOf("{");
  const j = t.lastIndexOf("}");
  if (i >= 0 && j > i) t = t.slice(i, j + 1);
  return JSON.parse(t) as T;
}

// Paso 1: leer las fotos del plan y extraer el JSON.
export async function extraerPlan(imagenes: ImagenPlan[]): Promise<PlanData> {
  if (imagenes.length === 0) throw new Error("Subí al menos una foto del plan.");

  const content: Anthropic.ContentBlockParam[] = [
    ...imagenes.map(
      (im) =>
        ({
          type: "image",
          source: {
            type: "base64",
            media_type: im.media_type as "image/jpeg" | "image/png" | "image/webp",
            data: im.data,
          },
        }) as Anthropic.ImageBlockParam
    ),
    {
      type: "text",
      text: "Analizá estas imágenes del plan nutricional y devolvé el JSON pedido.",
    },
  ];

  const res = await client().messages.create({
    model: MODEL,
    max_tokens: 8000,
    thinking: { type: "disabled" },
    system: SYSTEM_EXTRACCION,
    messages: [{ role: "user", content }],
  });

  const texto = res.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
  try {
    return parseJSON<PlanData>(texto);
  } catch {
    throw new Error("No pude leer el plan de las fotos. Probá con fotos más nítidas.");
  }
}

const consolidarTool: Anthropic.Tool = {
  name: "consolidar_plan",
  description:
    "Devuelve la lista del súper consolidada para toda la semana y la adaptación para niños de cada plato.",
  input_schema: {
    type: "object",
    properties: {
      lista: {
        type: "array",
        items: {
          type: "object",
          properties: {
            categoria: { type: "string", enum: [...CATEGORIAS_PLAN] },
            nombre: { type: "string" },
            cantidad_total: { type: "string", description: "cantidad numérica, ej '900'" },
            unidad: { type: "string", description: "g | kg | unidades | etc." },
            detalle: { type: "string", description: "de qué día/plato viene" },
          },
          required: ["categoria", "nombre", "cantidad_total", "unidad", "detalle"],
        },
      },
      adaptaciones: {
        type: "array",
        items: {
          type: "object",
          properties: {
            plato: { type: "string" },
            adaptacion: { type: "string" },
          },
          required: ["plato", "adaptacion"],
        },
      },
    },
    required: ["lista", "adaptaciones"],
  },
};

const SYSTEM_CONSOLIDACION = `Sos un asistente de planificación del hogar. A partir de un plan nutricional (en JSON), armá la lista del súper para TODA la semana y la adaptación de cada plato para los niños.

Porciones del hogar (los ingredientes del plan vienen "por 1 porción", ingredientes_1p):
- ALMUERZO: 2 adultos + 1 niño. Factor a aplicar a ingredientes_1p del almuerzo: 2,65 (niño = 65% del adulto).
- CENA: 3 adultos + 2 niños. Factor a aplicar a ingredientes_1p de la cena: 4,3.

Lista del súper:
- Sumá los MISMOS ingredientes a lo largo de todos los días y comidas.
- Escalá cada ingrediente por el factor de su comida (almuerzo o cena).
- Convertí a unidades de compra reales: carnes y proteínas en gramos o kilos (ej. "900" "g"); verduras en unidades o gramos según corresponda (ej. "10" "unidades").
- Agrupá en estas categorías EXACTAS: ${CATEGORIAS_PLAN.join(", ")}.
- En "detalle" indicá brevemente de qué día/plato viene (ej. "Día 1 almuerzo, Día 3 cena").

Adaptación para niños (uno por cada plato de almuerzo y cena de cada día):
- Misma comida, SIN restricción calórica (el plan es para que Yali baje de peso; los niños no).
- Porciones adecuadas a la edad, SIN picante, sabores suaves.
- En "plato" poné el nombre exacto del plato.`;

// Paso 2: consolidar lista del súper + adaptaciones para niños.
export async function consolidarPlan(plan: PlanData): Promise<Consolidado> {
  const res = await client().messages.create({
    model: MODEL,
    max_tokens: 8000,
    thinking: { type: "disabled" },
    system: [{ type: "text", text: SYSTEM_CONSOLIDACION, cache_control: { type: "ephemeral" } }],
    tools: [consolidarTool],
    tool_choice: { type: "tool", name: "consolidar_plan" },
    messages: [{ role: "user", content: JSON.stringify(plan) }],
  });

  const block = res.content.find((b) => b.type === "tool_use");
  if (!block || block.type !== "tool_use") {
    throw new Error("No pude consolidar la lista del súper.");
  }
  const input = block.input as Consolidado;
  return {
    lista: input.lista ?? [],
    adaptaciones: input.adaptaciones ?? [],
  };
}
