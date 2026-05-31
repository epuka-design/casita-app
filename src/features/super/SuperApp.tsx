"use client";

import { useState } from "react";
import { CalendarClock } from "lucide-react";
import {
  CATEGORIAS_SUPER_SEMANAL,
  CATEGORIAS_SUPER_MENSUAL,
} from "@/lib/categorias";
import type { Role } from "@/lib/roles";
import type { ListaData } from "./queries";
import { ListaPanel } from "./ListaPanel";

type Tab = "semanal" | "mensual";

export function SuperApp({
  rol,
  recordatorio,
  semana,
  mes,
  semanal,
  mensual,
  menuAprobado,
  mensualLabel,
}: {
  rol: Role;
  recordatorio: { texto: string | null; hoy: boolean };
  semana: string;
  mes: string;
  semanal: ListaData;
  mensual: ListaData;
  menuAprobado: boolean;
  mensualLabel: string;
}) {
  const [tab, setTab] = useState<Tab>("semanal");

  return (
    <div>
      {recordatorio.texto && (
        <div
          className={`mb-5 flex items-center gap-2 rounded-xl2 px-4 py-3 text-sm ${
            recordatorio.hoy
              ? "bg-terracota/10 text-terracota-ink"
              : "bg-verde/10 text-verde"
          }`}
        >
          <CalendarClock className="h-4 w-4" />
          {recordatorio.texto}
        </div>
      )}

      {/* Pestañas */}
      <div className="mb-5 inline-flex rounded-full bg-blanco p-1 shadow-suave">
        {(["semanal", "mensual"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              tab === t ? "bg-terracota text-blanco" : "text-tinta/60"
            }`}
          >
            {t === "semanal" ? "Semanal" : "Mensual"}
          </button>
        ))}
      </div>

      {tab === "semanal" ? (
        <ListaPanel
          tipo="semanal"
          periodo={semana}
          estado={semanal.estado}
          items={semanal.items}
          rol={rol}
          categorias={CATEGORIAS_SUPER_SEMANAL}
          menuAprobado={menuAprobado}
          tituloCompartir="Súper de la semana"
        />
      ) : (
        <ListaPanel
          tipo="mensual"
          periodo={mes}
          estado={mensual.estado}
          items={mensual.items}
          rol={rol}
          categorias={CATEGORIAS_SUPER_MENSUAL}
          tituloCompartir={`Súper mensual · ${mensualLabel}`}
        />
      )}
    </div>
  );
}
