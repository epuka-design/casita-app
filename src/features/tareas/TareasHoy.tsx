"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { toggleTarea, type ToggleResult } from "./actions";
import type { TareaHoy } from "./queries";

const CATEGORIA_LABEL: Record<string, string> = {
  cocina: "Cocina",
  limpieza: "Limpieza",
  niños: "Niños",
  ropa: "Ropa",
};

export function TareasHoy({ tareas }: { tareas: TareaHoy[] }) {
  const [items, setItems] = useState(tareas);
  const [, startTransition] = useTransition();

  function toggle(id: string) {
    const actual = items.find((i) => i.id === id);
    if (!actual) return;
    const nuevo = !actual.completada;

    // Optimista: cambia al instante.
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, completada: nuevo } : i))
    );

    startTransition(async () => {
      const res: ToggleResult = await toggleTarea(id, nuevo);
      if (!res.ok) {
        // Si falló, volvemos atrás.
        setItems((prev) =>
          prev.map((i) => (i.id === id ? { ...i, completada: !nuevo } : i))
        );
      }
    });
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl2 bg-blanco p-10 text-center shadow-suave">
        <p className="font-serif text-3xl text-tinta">No hay tareas para hoy</p>
        <p className="mt-2 text-lg text-tinta/60">Que tengas un lindo día.</p>
      </div>
    );
  }

  const todasListas = items.every((i) => i.completada);

  return (
    <div className="space-y-4">
      {todasListas && (
        <div className="rounded-xl2 bg-verde/10 px-6 py-10 text-center">
          <p className="font-serif text-4xl text-verde">¡Terminaste todo! 🎉</p>
          <p className="mt-2 text-lg text-tinta/70">
            Excelente trabajo de hoy.
          </p>
        </div>
      )}

      <ul className="space-y-3">
        {items.map((t) => (
          <li key={t.id}>
            <button
              type="button"
              onClick={() => toggle(t.id)}
              aria-pressed={t.completada}
              className="flex w-full items-center gap-5 rounded-xl2 bg-blanco p-5 text-left shadow-suave transition-colors active:bg-crema"
            >
              {/* Checkbox grande */}
              <span
                className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl border-2 transition-colors ${
                  t.completada
                    ? "border-verde bg-verde text-blanco"
                    : "border-tinta/20 bg-blanco"
                }`}
              >
                {t.completada && <Check className="h-7 w-7" strokeWidth={3} />}
              </span>

              {/* Texto */}
              <span className="min-w-0 flex-1">
                <span
                  className={`block text-xl font-medium leading-snug sm:text-2xl ${
                    t.completada ? "text-tinta/40 line-through" : "text-tinta"
                  }`}
                >
                  {t.nombre}
                </span>
                {t.categoria && (
                  <span className="mt-1 block text-base text-tinta/50">
                    {CATEGORIA_LABEL[t.categoria] ?? t.categoria}
                  </span>
                )}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
