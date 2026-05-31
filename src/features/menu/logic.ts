// Lógica del menú semanal: cálculo de semana y validación de reglas
// de la familia (warnings, no bloqueantes). Pura, sin acceso a datos.

import { DIAS_SEMANA } from "@/lib/categorias";

const TZ = "America/Argentina/Buenos_Aires";

export function hoyISO(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

// Lunes de la semana que contiene `iso` (por defecto, hoy), en yyyy-mm-dd.
export function inicioSemana(iso: string = hoyISO()): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const dow = dt.getUTCDay(); // 0 dom .. 6 sáb
  const diffLunes = (dow + 6) % 7; // días desde el lunes
  dt.setUTCDate(dt.getUTCDate() - diffLunes);
  return dt.toISOString().slice(0, 10);
}

export function semanaLabel(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const s = new Intl.DateTimeFormat("es-AR", {
    timeZone: "UTC",
    day: "numeric",
    month: "long",
  }).format(dt);
  return `Semana del ${s}`;
}

// ── Clasificadores de platos ─────────────────────────────────────
export interface PlatoInfo {
  nombre: string | null;
  categoria: string | null;
}

const RE_CARNE =
  /\b(carne|asado|milanesa|hamburg|cerdo|bondiola|lomo|bife|albóndiga|albondiga|goulash|rag[uú]|costeleta|chorizo|panceta|jam[oó]n|pollo|pavo|salm[oó]n|pescado|at[uú]n|kure)\b/i;
const RE_PASTA = /\b(fideo|tallar[ií]n|pasta|ñoqui|noqui|ravio|sorrentino|lasa|canelon)\b/i;
const RE_SOPA = /\b(sopa|caldo|vori|soyo)\b/i;
const RE_LIVIANO = /\b(ensalada|sopa|verdura|wok|bowl|wrap|grillad|al vapor)\b/i;

function tieneCarne(p: PlatoInfo): boolean {
  if (!p.nombre && !p.categoria) return false;
  if (p.categoria === "Carnes" || p.categoria === "Pollo") return true;
  return p.nombre ? RE_CARNE.test(p.nombre) : false;
}

function esPesado(p: PlatoInfo): boolean {
  return (
    p.categoria === "Carnes" ||
    p.categoria === "Pastas" ||
    p.categoria === "Casero Paraguayo"
  );
}

function esLiviano(p: PlatoInfo): boolean {
  if (p.categoria === "Fit/Saludable") return true;
  return p.nombre ? RE_LIVIANO.test(p.nombre) : false;
}

function esPasta(p: PlatoInfo): boolean {
  if (p.categoria === "Pastas") return true;
  return p.nombre ? RE_PASTA.test(p.nombre) : false;
}

function esSopa(p: PlatoInfo): boolean {
  return p.nombre ? RE_SOPA.test(p.nombre) : false;
}

function lleno(p: PlatoInfo): boolean {
  return Boolean(p.nombre);
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export interface DiaMenu {
  dia: string;
  almuerzo: PlatoInfo;
  cena: PlatoInfo;
}

// Devuelve los warnings de la familia. No bloquean la aprobación.
export function calcularWarnings(dias: DiaMenu[]): string[] {
  const w: string[] = [];

  // Regla: al menos un día sin carne (con ambos platos cargados).
  const hayDiaSinCarne = dias.some(
    (d) =>
      lleno(d.almuerzo) &&
      lleno(d.cena) &&
      !tieneCarne(d.almuerzo) &&
      !tieneCarne(d.cena)
  );
  const algunDiaCompleto = dias.some(
    (d) => lleno(d.almuerzo) && lleno(d.cena)
  );
  if (algunDiaCompleto && !hayDiaSinCarne) {
    w.push("No hay ningún día sin carne. Conviene dejar al menos uno.");
  }

  for (const d of dias) {
    // Cena liviana si el almuerzo es pesado.
    if (lleno(d.almuerzo) && lleno(d.cena) && esPesado(d.almuerzo) && !esLiviano(d.cena)) {
      w.push(`${cap(d.dia)}: el almuerzo es pesado, conviene una cena más liviana.`);
    }
    // Sin fideos de noche.
    if (lleno(d.cena) && esPasta(d.cena)) {
      w.push(`${cap(d.dia)}: hay fideos/pasta en la cena.`);
    }
    // Sin sopa en la cena.
    if (lleno(d.cena) && esSopa(d.cena)) {
      w.push(`${cap(d.dia)}: hay sopa en la cena.`);
    }
  }

  return w;
}

export { DIAS_SEMANA };
