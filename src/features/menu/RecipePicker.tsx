"use client";

import { useState } from "react";
import { X, Search, Plus } from "lucide-react";
import { CATEGORIAS_RECETA } from "@/lib/categorias";
import type { RecetaMin } from "./ai";

const TODAS = "Todas";

export function RecipePicker({
  recetas,
  titulo,
  onPick,
  onClose,
  onCrear,
}: {
  recetas: RecetaMin[];
  titulo: string;
  onPick: (id: string) => void;
  onClose: () => void;
  onCrear?: (nombre: string) => void;
}) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>(TODAS);

  const visibles = recetas.filter((r) => {
    const okCat = cat === TODAS || r.categoria === cat;
    const okQ = r.nombre.toLowerCase().includes(q.trim().toLowerCase());
    return okCat && okQ;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-tinta/30 p-0 sm:items-center sm:p-6">
      <div className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-t-xl2 bg-blanco shadow-carta sm:rounded-xl2">
        <header className="flex items-center justify-between border-b border-tinta/5 px-5 py-4">
          <h2 className="font-serif text-xl">{titulo}</h2>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full text-tinta/50 hover:bg-crema"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="space-y-3 px-5 pt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-tinta/30" />
            <input
              className="campo pl-9"
              placeholder="Buscar receta…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              autoFocus
            />
          </div>
          <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
            {[TODAS, ...CATEGORIAS_RECETA].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCat(c)}
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  cat === c ? "bg-terracota text-blanco" : "bg-crema text-tinta/60"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <ul className="mt-2 flex-1 overflow-y-auto px-5 pb-5">
          {visibles.length === 0 ? (
            <li className="py-8 text-center text-sm text-tinta/40">
              Sin resultados.
            </li>
          ) : (
            visibles.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => onPick(r.id)}
                  className="flex w-full items-center justify-between gap-3 border-b border-tinta/5 py-3 text-left hover:text-terracota"
                >
                  <span className="text-sm">{r.nombre}</span>
                  {r.categoria && (
                    <span className="shrink-0 text-xs text-tinta/40">
                      {r.categoria}
                    </span>
                  )}
                </button>
              </li>
            ))
          )}
        </ul>

        {onCrear && q.trim() && (
          <div className="border-t border-tinta/5 px-5 py-3">
            <button
              type="button"
              onClick={() => onCrear(q.trim())}
              className="btn w-full"
            >
              <Plus className="h-4 w-4" /> Crear «{q.trim()}»
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
