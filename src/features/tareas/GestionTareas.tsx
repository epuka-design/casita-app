"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { CICLOS_TAREA, CATEGORIAS_TAREA } from "@/lib/categorias";
import type { TareaRow } from "@/types/database";
import type { Miembro } from "@/features/hogar/queries";
import {
  crearTarea,
  editarTarea,
  eliminarTarea,
  type TareaResult,
} from "./actions";

const CICLO_LABEL: Record<string, string> = {
  diaria: "Diarias",
  quincenal: "Quincenales",
  mensual: "Mensuales",
};
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function GestionTareas({
  tareas,
  miembros,
}: {
  tareas: TareaRow[];
  miembros: Miembro[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [nNombre, setNNombre] = useState("");
  const [nCiclo, setNCiclo] = useState<string>(CICLOS_TAREA[0]);
  const [nCat, setNCat] = useState<string>(CATEGORIAS_TAREA[0]);
  const [nAsig, setNAsig] = useState<string>("");

  function correr(fn: () => Promise<TareaResult>) {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) setError(res.error);
      else router.refresh();
    });
  }

  function agregar(e: React.FormEvent) {
    e.preventDefault();
    if (!nNombre.trim()) return;
    const input = {
      nombre: nNombre,
      ciclo: nCiclo,
      categoria: nCat,
      asignado_a: nAsig || null,
    };
    setNNombre("");
    correr(() => crearTarea(input));
  }

  const nombreDe = (id: string | null) =>
    id ? miembros.find((m) => m.id === id)?.nombre ?? "—" : "";

  return (
    <div>
      {error && (
        <p className="mb-4 rounded-xl bg-terracota/10 px-4 py-2.5 text-sm text-terracota-ink">
          {error}
        </p>
      )}

      {/* Agregar tarea */}
      <form onSubmit={agregar} className="carta mb-6 space-y-3">
        <h2 className="font-serif text-xl">Agregar tarea</h2>
        <input
          className="campo"
          value={nNombre}
          onChange={(e) => setNNombre(e.target.value)}
          placeholder="Ej: Regar las plantas"
        />
        <div className="grid grid-cols-3 gap-2">
          <select className="campo" value={nCiclo} onChange={(e) => setNCiclo(e.target.value)}>
            {CICLOS_TAREA.map((c) => (
              <option key={c} value={c}>{cap(c)}</option>
            ))}
          </select>
          <select className="campo" value={nCat} onChange={(e) => setNCat(e.target.value)}>
            {CATEGORIAS_TAREA.map((c) => (
              <option key={c} value={c}>{cap(c)}</option>
            ))}
          </select>
          <select className="campo" value={nAsig} onChange={(e) => setNAsig(e.target.value)}>
            <option value="">Sin asignar</option>
            {miembros.map((m) => (
              <option key={m.id} value={m.id}>{m.nombre}</option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn" disabled={pending}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Agregar tarea
        </button>
      </form>

      {/* Listado por ciclo */}
      {CICLOS_TAREA.map((ciclo) => {
        const delCiclo = tareas.filter((t) => t.ciclo === ciclo);
        if (delCiclo.length === 0) return null;
        return (
          <section key={ciclo} className="mb-6">
            <h2 className="mb-2 font-serif text-xl">{CICLO_LABEL[ciclo]}</h2>
            <ul className="space-y-2">
              {delCiclo.map((t) => (
                <li key={t.id} className="carta space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      key={t.id + t.nombre}
                      defaultValue={t.nombre}
                      onBlur={(e) => {
                        if (e.target.value.trim() && e.target.value !== t.nombre)
                          correr(() => editarTarea(t.id, { nombre: e.target.value }));
                      }}
                      className="campo flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => correr(() => eliminarTarea(t.id))}
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-tinta/10 text-tinta/40 hover:text-terracota"
                      aria-label="Borrar tarea"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <select
                      className="campo"
                      value={t.ciclo ?? "diaria"}
                      onChange={(e) => correr(() => editarTarea(t.id, { ciclo: e.target.value }))}
                    >
                      {CICLOS_TAREA.map((c) => (
                        <option key={c} value={c}>{cap(c)}</option>
                      ))}
                    </select>
                    <select
                      className="campo"
                      value={t.categoria ?? CATEGORIAS_TAREA[0]}
                      onChange={(e) => correr(() => editarTarea(t.id, { categoria: e.target.value }))}
                    >
                      {CATEGORIAS_TAREA.map((c) => (
                        <option key={c} value={c}>{cap(c)}</option>
                      ))}
                    </select>
                    <select
                      className="campo"
                      value={t.asignado_a ?? ""}
                      onChange={(e) =>
                        correr(() => editarTarea(t.id, { asignado_a: e.target.value || null }))
                      }
                    >
                      <option value="">Sin asignar</option>
                      {miembros.map((m) => (
                        <option key={m.id} value={m.id}>{m.nombre}</option>
                      ))}
                    </select>
                  </div>
                  {t.asignado_a && (
                    <p className="text-xs text-tinta/40">
                      Responsable: {nombreDe(t.asignado_a)}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
