import "server-only";
import { currentUser } from "@clerk/nextjs/server";
import { requireHogar } from "@/lib/auth";
import { DIAS_SEMANA } from "@/lib/categorias";
import { getMenuSemana } from "@/features/menu/queries";
import { inicioSemana } from "@/features/menu/logic";
import { fechaLarga } from "@/features/tareas/logic";
import { getRecetas } from "@/features/recetas/queries";
import { getTareasDeHoy } from "@/features/tareas/queries";
import { getLista } from "@/features/super/queries";
import { inicioMes } from "@/features/super/dias";
import type { EstadoMenu } from "@/types/database";

const TZ = "America/Argentina/Buenos_Aires";

export interface Alerta {
  tipo: "urgente" | "info";
  texto: string;
  href: string;
  cta: string;
}

export interface DiaResumen {
  dia: string;
  hoy: boolean;
  almuerzo: string | null;
  cena: string | null;
}

export interface AdminDashboardData {
  nombre: string;
  saludo: string;
  fecha: string;
  menuHoy: { estado: EstadoMenu; almuerzo: string | null; cena: string | null };
  alertas: Alerta[];
  tareas: { hechas: number; total: number; faltan: string[] };
  semana: DiaResumen[];
}

function saludoPorHora(): string {
  const h = Number(
    new Intl.DateTimeFormat("es-AR", {
      timeZone: TZ,
      hour: "2-digit",
      hour12: false,
    }).format(new Date())
  );
  if (h < 12) return "Buenos días";
  if (h < 20) return "Buenas tardes";
  return "Buenas noches";
}

function diaHoyNombre(): string {
  const iso = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const [y, m, d] = iso.split("-").map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return DIAS_SEMANA[(dow + 6) % 7];
}

function diasHastaProximoMes(): number {
  const iso = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const [y, m, d] = iso.split("-").map(Number);
  const hoy = Date.UTC(y, m - 1, d);
  const proximo = Date.UTC(y, m, 1); // mes m (índice) = mes siguiente
  return Math.round((proximo - hoy) / 86_400_000);
}

export async function getAdminDashboard(): Promise<AdminDashboardData> {
  const dbUser = await requireHogar();
  const hogarId = dbUser.hogar_id;
  const clerk = await currentUser();
  const nombre = clerk?.firstName ?? dbUser.nombre.split(" ")[0] ?? "Yali";
  const semana = inicioSemana();

  const [menu, recetas, tareasHoy, superSem, superMes] = await Promise.all([
    getMenuSemana(hogarId, semana),
    getRecetas(hogarId),
    getTareasDeHoy(hogarId, dbUser.id),
    getLista(hogarId, "semanal", semana),
    getLista(hogarId, "mensual", inicioMes()),
  ]);

  const nombrePorId = new Map(recetas.map((r) => [r.id, r.nombre]));
  const nom = (id?: string) => (id ? nombrePorId.get(id) ?? null : null);

  const diaHoy = diaHoyNombre();
  const menuHoy = {
    estado: menu.estado,
    almuerzo: nom(menu.slots[`${diaHoy}|almuerzo`]),
    cena: nom(menu.slots[`${diaHoy}|cena`]),
  };

  const alertas: Alerta[] = [];
  if (menu.estado === "pendiente")
    alertas.push({
      tipo: "urgente",
      texto: "Hay un menú esperando tu aprobación",
      href: "/menu",
      cta: "Aprobar",
    });
  if (superSem.estado === "pendiente")
    alertas.push({
      tipo: "urgente",
      texto: "La lista del súper de la semana está pendiente",
      href: "/super",
      cta: "Revisar",
    });
  if (superMes.estado === "pendiente")
    alertas.push({
      tipo: "urgente",
      texto: "La lista mensual del súper está pendiente",
      href: "/super",
      cta: "Revisar",
    });
  const diasMes = diasHastaProximoMes();
  if (diasMes <= 7)
    alertas.push({
      tipo: "info",
      texto: `Faltan ${diasMes} día${diasMes === 1 ? "" : "s"} para el súper mensual`,
      href: "/super",
      cta: "Ver",
    });

  const tareas = {
    hechas: tareasHoy.tareas.filter((t) => t.completada).length,
    total: tareasHoy.tareas.length,
    faltan: tareasHoy.tareas.filter((t) => !t.completada).map((t) => t.nombre),
  };

  const semanaResumen: DiaResumen[] = DIAS_SEMANA.map((dia) => ({
    dia,
    hoy: dia === diaHoy,
    almuerzo: nom(menu.slots[`${dia}|almuerzo`]),
    cena: nom(menu.slots[`${dia}|cena`]),
  }));

  return {
    nombre,
    saludo: saludoPorHora(),
    fecha: fechaLarga(),
    menuHoy,
    alertas,
    tareas,
    semana: semanaResumen,
  };
}
