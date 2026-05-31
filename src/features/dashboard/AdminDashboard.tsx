import Link from "next/link";
import {
  UtensilsCrossed,
  ShoppingCart,
  CheckSquare,
  BookOpen,
  AlertTriangle,
  Bell,
  ChevronRight,
  Sun,
  Sparkles,
} from "lucide-react";
import type { EstadoMenu } from "@/types/database";
import type { AdminDashboardData } from "./data";

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const ESTADO_CHIP: Record<EstadoMenu, { label: string; clase: string }> = {
  borrador: { label: "Borrador", clase: "bg-tinta/10 text-tinta/60" },
  pendiente: { label: "Pendiente", clase: "bg-terracota/15 text-terracota-ink" },
  aprobado: { label: "Aprobado", clase: "bg-verde/15 text-verde" },
};

const ACCESOS = [
  { href: "/menu", label: "Aprobar menú", icon: UtensilsCrossed },
  { href: "/super", label: "Ver lista súper", icon: ShoppingCart },
  { href: "/tareas", label: "Ver tareas", icon: CheckSquare },
  { href: "/recetas", label: "Banco de recetas", icon: BookOpen },
] as const;

function Seccion({
  children,
  delay,
}: {
  children: React.ReactNode;
  delay: number;
}) {
  return (
    <section className="rise" style={{ animationDelay: `${delay}ms` }}>
      {children}
    </section>
  );
}

function Anillo({ hechas, total }: { hechas: number; total: number }) {
  const pct = total > 0 ? hechas / total : 0;
  const R = 26;
  const C = 2 * Math.PI * R;
  return (
    <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90">
      <circle cx="32" cy="32" r={R} fill="none" stroke="currentColor" strokeWidth="6" className="text-tinta/10" />
      <circle
        cx="32"
        cy="32"
        r={R}
        fill="none"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
        className="text-verde transition-all"
        strokeDasharray={C}
        strokeDashoffset={C * (1 - pct)}
      />
    </svg>
  );
}

export function AdminDashboard({ data }: { data: AdminDashboardData }) {
  const { menuHoy, tareas } = data;
  const chip = ESTADO_CHIP[menuHoy.estado];
  const todoAlDia = tareas.total > 0 && tareas.hechas === tareas.total;

  return (
    <div className="space-y-6">
      {/* 1 · Encabezado */}
      <Seccion delay={0}>
        <p className="text-xs uppercase tracking-[0.22em] text-tinta/40">
          {data.fecha}
        </p>
        <h1 className="mt-1 font-serif text-4xl font-medium text-tinta sm:text-5xl">
          {data.saludo}, {data.nombre}
        </h1>
      </Seccion>

      {/* 2 · Menú de hoy */}
      <Seccion delay={70}>
        <div className="rounded-xl2 bg-gradient-to-br from-blanco to-crema p-6 shadow-carta">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sun className="h-4 w-4 text-terracota" />
              <h2 className="font-serif text-xl">Menú de hoy</h2>
            </div>
            <span className={`chip ${chip.clase}`}>{chip.label}</span>
          </div>
          <dl className="space-y-3">
            {(["almuerzo", "cena"] as const).map((tipo) => (
              <div key={tipo} className="flex items-baseline gap-4">
                <dt className="w-20 shrink-0 text-sm uppercase tracking-wide text-tinta/40">
                  {tipo}
                </dt>
                <dd
                  className={`font-serif text-lg ${
                    menuHoy[tipo] ? "text-tinta" : "text-tinta/30"
                  }`}
                >
                  {menuHoy[tipo] ?? "Sin asignar"}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </Seccion>

      {/* 3 · Alertas activas */}
      {data.alertas.length > 0 && (
        <Seccion delay={140}>
          <div className="space-y-2">
            {data.alertas.map((a, i) => {
              const urgente = a.tipo === "urgente";
              return (
                <Link
                  key={i}
                  href={a.href}
                  className={`flex items-center gap-3 rounded-xl2 border px-4 py-3.5 transition-transform hover:-translate-y-0.5 ${
                    urgente
                      ? "border-terracota/20 bg-terracota/5"
                      : "border-verde/20 bg-verde/5"
                  }`}
                >
                  {urgente ? (
                    <AlertTriangle className="h-5 w-5 shrink-0 text-terracota" />
                  ) : (
                    <Bell className="h-5 w-5 shrink-0 text-verde" />
                  )}
                  <span className="flex-1 text-sm text-tinta/80">{a.texto}</span>
                  <span
                    className={`inline-flex items-center gap-0.5 text-sm font-medium ${
                      urgente ? "text-terracota-ink" : "text-verde"
                    }`}
                  >
                    {a.cta} <ChevronRight className="h-4 w-4" />
                  </span>
                </Link>
              );
            })}
          </div>
        </Seccion>
      )}

      {/* 4 · Progreso de tareas */}
      <Seccion delay={210}>
        <div className="carta">
          <div className="flex items-center gap-4">
            <div className="relative grid place-items-center">
              <Anillo hechas={tareas.hechas} total={tareas.total} />
              <span className="absolute text-sm font-semibold text-tinta">
                {tareas.hechas}/{tareas.total || 0}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-serif text-xl">Tareas de hoy</h2>
              {tareas.total === 0 ? (
                <p className="mt-1 text-sm text-tinta/50">
                  No hay tareas para hoy.
                </p>
              ) : todoAlDia ? (
                <p className="mt-1 inline-flex items-center gap-1 text-sm text-verde">
                  <Sparkles className="h-4 w-4" /> ¡Todo completado!
                </p>
              ) : (
                <p className="mt-1 line-clamp-2 text-sm text-tinta/50">
                  Falta: {tareas.faltan.join(" · ")}
                </p>
              )}
            </div>
            <Link
              href="/tareas"
              className="shrink-0 text-tinta/30 hover:text-terracota"
              aria-label="Ver tareas"
            >
              <ChevronRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </Seccion>

      {/* 5 · Accesos rápidos */}
      <Seccion delay={280}>
        <div className="grid grid-cols-2 gap-3">
          {ACCESOS.map((a) => {
            const Icon = a.icon;
            return (
              <Link
                key={a.href}
                href={a.href}
                className="flex items-center gap-3 rounded-xl2 bg-blanco p-4 shadow-suave transition-transform hover:-translate-y-0.5"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-terracota/10">
                  <Icon className="h-5 w-5 text-terracota" strokeWidth={1.75} />
                </span>
                <span className="text-sm font-medium leading-tight">
                  {a.label}
                </span>
              </Link>
            );
          })}
        </div>
      </Seccion>

      {/* 6 · Resumen de la semana */}
      <Seccion delay={350}>
        <div className="carta">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-serif text-xl">La semana</h2>
            <Link
              href="/menu"
              className="inline-flex items-center gap-0.5 text-sm text-terracota hover:text-terracota-ink"
            >
              Ver menú <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <ul className="divide-y divide-tinta/5">
            {data.semana.map((d) => (
              <li
                key={d.dia}
                className={`flex items-center gap-3 py-2 text-sm ${
                  d.hoy ? "font-medium" : ""
                }`}
              >
                <span
                  className={`w-10 shrink-0 ${
                    d.hoy ? "text-terracota" : "text-tinta/40"
                  }`}
                >
                  {cap(d.dia).slice(0, 3)}
                </span>
                <span className="flex-1 truncate text-tinta/70">
                  {d.almuerzo ?? "—"}
                </span>
                <span className="flex-1 truncate text-right text-tinta/50">
                  {d.cena ?? "—"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </Seccion>
    </div>
  );
}
