"use client";

import { useState } from "react";
import Link from "next/link";
import { Clock, Users } from "lucide-react";
import { CATEGORIAS_RECETA } from "@/lib/categorias";
import type { RecetaRow } from "@/types/database";

const TODAS = "Todas";

export function RecetasLista({ recetas }: { recetas: RecetaRow[] }) {
  const [filtro, setFiltro] = useState<string>(TODAS);

  const visibles =
    filtro === TODAS
      ? recetas
      : recetas.filter((r) => r.categoria === filtro);

  return (
    <div>
      {/* Filtro por categoría */}
      <div className="-mx-5 mb-5 flex gap-2 overflow-x-auto px-5 pb-1 md:mx-0 md:flex-wrap md:px-0">
        {[TODAS, ...CATEGORIAS_RECETA].map((cat) => {
          const activo = filtro === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setFiltro(cat)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                activo
                  ? "bg-terracota text-blanco"
                  : "bg-blanco text-tinta/60 hover:text-tinta"
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {visibles.length === 0 ? (
        <div className="carta text-tinta/50">
          No hay recetas en esta categoría todavía.
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {visibles.map((r) => (
            <li key={r.id}>
              <Link
                href={`/recetas/${r.id}`}
                className="carta flex h-full flex-col gap-2 transition-transform hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-serif text-xl leading-tight">
                    {r.nombre}
                  </h3>
                  {r.categoria && <span className="chip">{r.categoria}</span>}
                </div>
                <div className="mt-auto flex items-center gap-3 text-xs text-tinta/50">
                  {r.tiempo_min != null && (
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" /> {r.tiempo_min} min
                    </span>
                  )}
                  {r.porciones > 0 && (
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" /> {r.porciones}
                    </span>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
