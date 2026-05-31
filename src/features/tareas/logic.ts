// Lógica de fechas y ciclos de tareas. Pura, sin acceso a datos.
// Se calcula en la zona horaria de Argentina para evitar corrimientos
// de día a la medianoche.

const TZ = "America/Argentina/Buenos_Aires";

// Fecha de hoy en ARG: { iso: "2026-05-31", dia: 31 }.
export function hoy(): { iso: string; dia: number } {
  const iso = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  return { iso, dia: Number(iso.slice(8, 10)) };
}

// "Domingo 31 de mayo" — para mostrar en pantalla.
export function fechaLarga(): string {
  const s = new Intl.DateTimeFormat("es-AR", {
    timeZone: TZ,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ¿Esta tarea corresponde hoy, según su ciclo?
//  - diaria:    todos los días
//  - quincenal: días 1 y 15
//  - mensual:   día 1
export function tareaAplicaHoy(ciclo: string | null, dia: number): boolean {
  switch (ciclo) {
    case "diaria":
      return true;
    case "quincenal":
      return dia === 1 || dia === 15;
    case "mensual":
      return dia === 1;
    default:
      return false;
  }
}
