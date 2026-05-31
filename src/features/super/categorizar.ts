import type { CategoriaSemanal } from "@/lib/categorias";

// Diccionario palabra clave → categoría del súper semanal.
// Se evalúa en orden; lo no reconocido cae en "Despensa".
// Los procesados de despensa (pasta de tomate, caldo, especias) van
// primero para no confundirse con frutas/verduras frescas.
const DICT: [CategoriaSemanal, RegExp][] = [
  [
    "Despensa",
    /\b(aceite|sal\b|az[uú]car|harina|caldo|mostaza|miel|arroz|fideo|polenta|avena|legumbre|lenteja|garbanzo|poroto|pasta de tomate|pur[eé] de tomate|extracto|vinagre|or[eé]gano|piment[oó]n|nuez moscada|pimienta|comino|laurel|mayonesa|ketchup|salsa de soja|caf[eé]|t[eé]\b|yerba|galleta)\b/i,
  ],
  [
    "Carnes y proteínas",
    /\b(pollo|pechuga|suprema|carne|cerdo|bondiola|lomo|bife|milanesa|salm[oó]n|pescado|at[uú]n|merluza|huevo|jam[oó]n|panceta|chorizo|salchicha|pavo|cordero|kure)\b/i,
  ],
  [
    "Lácteos",
    /\b(leche|queso|crema|yogur|manteca|ricota|muzzarella|mozzarella|dulce de leche)\b/i,
  ],
  [
    "Frutas",
    /\b(lim[oó]n|naranja|manzana|banana|frutilla|pera|durazno|uva|mandarina|pomelo|frut|anan[aá]|kiwi|ciruela)\b/i,
  ],
  [
    "Verduras",
    /\b(zucchini|zapallit|zapallo|morr[oó]n|cebolla|zanahoria|coliflor|br[oó]coli|tomate|esp[aá]rrago|repollo|choclo|ajo|lechuga|batata|papa|champi|palta|espinaca|acelga|verdura|pepino|berenjena|rúcula|rucula|remolacha|apio|puerro|perejil|cilantro)\b/i,
  ],
  ["Panadería", /\b(pan\b|tortilla|factura|prepizza|tapa|baguette|lactal)\b/i],
];

export function categorizarIngrediente(nombre: string): CategoriaSemanal {
  for (const [cat, re] of DICT) {
    if (re.test(nombre)) return cat;
  }
  return "Despensa";
}
