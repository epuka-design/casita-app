// Utilidades para porciones del hogar y escalado de cantidades.

// Porciones objetivo del hogar (redondeadas). Un niño cuenta como
// `factorNino` de un adulto. Caso Casita: 3 adultos + 2 niños × 0,5 = 4.
export function porcionesObjetivo(
  adultos: number,
  ninos: number,
  factorNino: number
): number {
  return Math.max(1, Math.round(adultos + ninos * factorNino));
}

function formatNum(n: number): string {
  const r = Math.round(n * 100) / 100;
  if (Math.abs(r - Math.round(r)) < 0.05) return String(Math.round(r));
  return String(Math.round(r * 10) / 10);
}

// Escala la parte numérica inicial de una cantidad de texto libre.
// "500 g" ×2 → "1000 g" · "1/2 taza" ×2 → "1 taza" · "a gusto" → "a gusto".
// Mejor esfuerzo: si no empieza con número, se devuelve tal cual.
export function escalarCantidad(
  cantidad: string | null | undefined,
  factor: number
): string {
  if (!cantidad) return "";
  const texto = cantidad.trim();
  if (factor === 1) return texto;

  const m = texto.match(/^(\d+(?:[.,]\d+)?|\d+\/\d+)\s*(.*)$/);
  if (!m) return texto; // sin número al inicio → no se toca

  const [, num, resto] = m;
  let val: number;
  if (num.includes("/")) {
    const [a, b] = num.split("/").map(Number);
    val = b ? a / b : NaN;
  } else {
    val = parseFloat(num.replace(",", "."));
  }
  if (!Number.isFinite(val)) return texto;

  const escalado = formatNum(val * factor);
  return resto ? `${escalado} ${resto}` : escalado;
}

// Combina varias cantidades (de la misma ingrediente en distintas
// recetas) en una sola. Suma las que comparten unidad; el resto se
// concatena. "1" + "2" → "3" · "2 cdas" + "3 cdas" → "5 cdas" ·
// "a gusto" + "1" → "1 + a gusto".
export function combinarCantidades(cantidades: string[]): string {
  const porUnidad = new Map<string, number>();
  const otros: string[] = [];

  for (const c of cantidades) {
    const t = (c ?? "").trim();
    if (!t) continue;
    const m = t.match(/^(\d+(?:[.,]\d+)?|\d+\/\d+)\s*(.*)$/);
    if (!m) {
      otros.push(t);
      continue;
    }
    let val: number;
    if (m[1].includes("/")) {
      const [a, b] = m[1].split("/").map(Number);
      val = b ? a / b : NaN;
    } else {
      val = parseFloat(m[1].replace(",", "."));
    }
    if (!Number.isFinite(val)) {
      otros.push(t);
      continue;
    }
    const unidad = m[2].trim().toLowerCase();
    porUnidad.set(unidad, (porUnidad.get(unidad) ?? 0) + val);
  }

  const partes: string[] = [];
  porUnidad.forEach((val, unidad) => {
    partes.push(unidad ? `${formatNum(val)} ${unidad}` : formatNum(val));
  });
  partes.push(...otros);
  return partes.join(" + ");
}
