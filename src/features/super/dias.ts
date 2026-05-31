// Días de súper: martes y sábados. Recordatorio cuando se acerca.

const TZ = "America/Argentina/Buenos_Aires";
// getUTCDay: 0 dom, 1 lun, 2 mar, ... 6 sáb. Súper = martes (2) y sábado (6).
const DIAS_SUPER = new Set([2, 6]);

function dowHoy(): number {
  const iso = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export interface Recordatorio {
  texto: string | null;
  hoy: boolean;
}

export function recordatorioSuper(): Recordatorio {
  const dow = dowHoy();
  if (DIAS_SUPER.has(dow)) return { texto: "Hoy es día de súper 🛒", hoy: true };
  if (DIAS_SUPER.has((dow + 1) % 7))
    return { texto: "Mañana es día de súper", hoy: false };
  return { texto: null, hoy: false };
}

// Primer día del mes actual (yyyy-mm-01) en hora de Argentina.
export function inicioMes(): string {
  const iso = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  return `${iso.slice(0, 7)}-01`;
}

export function mesLabel(periodo: string): string {
  const [y, m] = periodo.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, 1));
  const s = new Intl.DateTimeFormat("es-AR", {
    timeZone: "UTC",
    month: "long",
    year: "numeric",
  }).format(dt);
  return s.charAt(0).toUpperCase() + s.slice(1);
}
