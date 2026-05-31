"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Loader2 } from "lucide-react";
import { CATEGORIAS_SUPER_MENSUAL } from "@/lib/categorias";
import type { ItemFijo } from "./queries";
import { agregarFijo, quitarFijo, type SuperResult } from "./actions";

export function ItemsFijos({ items }: { items: ItemFijo[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [cat, setCat] = useState<string>(CATEGORIAS_SUPER_MENSUAL[0]);
  const [nombre, setNombre] = useState("");

  function correr(fn: () => Promise<SuperResult>) {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) setError(res.error);
      else router.refresh();
    });
  }

  function agregar(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim()) return;
    const c = cat;
    const n = nombre;
    setNombre("");
    correr(() => agregarFijo(c, n));
  }

  return (
    <div className="carta">
      <h2 className="mb-1 font-serif text-xl">Items fijos del mes</h2>
      <p className="subtitulo mb-4">
        Se usan para generar la lista mensual del súper.
      </p>

      <div className="space-y-4">
        {CATEGORIAS_SUPER_MENSUAL.map((c) => {
          const delCat = items.filter((i) => i.categoria === c);
          if (delCat.length === 0) return null;
          return (
            <section key={c}>
              <h3 className="mb-1 text-xs font-medium uppercase tracking-wide text-tinta/50">
                {c}
              </h3>
              <ul className="flex flex-wrap gap-2">
                {delCat.map((it) => (
                  <li
                    key={it.id}
                    className="inline-flex items-center gap-1.5 rounded-full bg-crema px-3 py-1 text-sm"
                  >
                    {it.item}
                    <button
                      type="button"
                      onClick={() => correr(() => quitarFijo(it.id))}
                      className="text-tinta/30 hover:text-terracota"
                      aria-label={`Quitar ${it.item}`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      {error && (
        <p className="mt-3 rounded-xl bg-terracota/10 px-4 py-2 text-sm text-terracota-ink">
          {error}
        </p>
      )}

      <form onSubmit={agregar} className="mt-5 flex flex-wrap items-end gap-2">
        <div className="min-w-0 flex-1">
          <label className="etiqueta">Nuevo item</label>
          <input
            className="campo"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Papel higiénico"
          />
        </div>
        <div className="w-40">
          <label className="etiqueta">Categoría</label>
          <select
            className="campo"
            value={cat}
            onChange={(e) => setCat(e.target.value)}
          >
            {CATEGORIAS_SUPER_MENSUAL.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn" disabled={pending}>
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          Agregar
        </button>
      </form>
    </div>
  );
}
