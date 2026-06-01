"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { CATEGORIAS_RECETA } from "@/lib/categorias";
import type { RecetaRow, IngredienteReceta } from "@/types/database";
import { crearReceta, editarReceta } from "./actions";

export function RecetaForm({ receta }: { receta?: RecetaRow }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [nombre, setNombre] = useState(receta?.nombre ?? "");
  const [categoria, setCategoria] = useState(
    receta?.categoria ?? CATEGORIAS_RECETA[0]
  );
  const [porciones, setPorciones] = useState(receta?.porciones ?? 2);
  const [tiempo, setTiempo] = useState(
    receta?.tiempo_min != null ? String(receta.tiempo_min) : ""
  );
  const [instrucciones, setInstrucciones] = useState(
    receta?.instrucciones ?? ""
  );
  const [ingredientes, setIngredientes] = useState<IngredienteReceta[]>(
    receta?.ingredientes?.length
      ? receta.ingredientes
      : [{ nombre: "", cantidad: "" }]
  );

  const setIng = (i: number, key: keyof IngredienteReceta, val: string) =>
    setIngredientes((prev) =>
      prev.map((ing, idx) => (idx === i ? { ...ing, [key]: val } : ing))
    );

  const addIng = () =>
    setIngredientes((prev) => [...prev, { nombre: "", cantidad: "" }]);

  const removeIng = (i: number) =>
    setIngredientes((prev) => prev.filter((_, idx) => idx !== i));

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const input = {
      nombre,
      categoria,
      porciones,
      tiempo_min: tiempo === "" ? null : Number(tiempo),
      instrucciones,
      // Sólo ingredientes completos; las filas a medio llenar se ignoran.
      ingredientes: ingredientes.filter(
        (i) => i.nombre.trim() && i.cantidad.trim()
      ),
    };
    startTransition(async () => {
      const res = receta
        ? await editarReceta(receta.id, input)
        : await crearReceta(input);
      // Si todo salió bien la acción redirige; sólo llega acá si hubo error.
      if (res && !res.ok) setError(res.error);
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <label className="etiqueta" htmlFor="nombre">
          Nombre
        </label>
        <input
          id="nombre"
          className="campo"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Milanesas con puré"
          autoFocus
        />
      </div>

      <div>
        <label className="etiqueta" htmlFor="categoria">
          Categoría
        </label>
        <select
          id="categoria"
          className="campo"
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
        >
          {CATEGORIAS_RECETA.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="etiqueta" htmlFor="porciones">
            Porciones
          </label>
          <input
            id="porciones"
            type="number"
            min={1}
            max={50}
            className="campo"
            value={porciones}
            onChange={(e) => setPorciones(Number(e.target.value))}
          />
        </div>
        <div>
          <label className="etiqueta" htmlFor="tiempo">
            Tiempo (min)
          </label>
          <input
            id="tiempo"
            type="number"
            min={1}
            max={1440}
            className="campo"
            value={tiempo}
            onChange={(e) => setTiempo(e.target.value)}
            placeholder="Opcional"
          />
        </div>
      </div>

      <div>
        <span className="etiqueta">Ingredientes</span>
        <div className="space-y-2">
          {ingredientes.map((ing, i) => (
            <div key={i} className="flex gap-2">
              <input
                className="campo flex-1"
                value={ing.nombre}
                onChange={(e) => setIng(i, "nombre", e.target.value)}
                placeholder="Ingrediente"
              />
              <input
                className="campo w-28"
                value={ing.cantidad}
                onChange={(e) => setIng(i, "cantidad", e.target.value)}
                placeholder="Cantidad"
              />
              <button
                type="button"
                onClick={() => removeIng(i)}
                disabled={ingredientes.length === 1}
                className="grid w-10 shrink-0 place-items-center rounded-xl border border-tinta/10 text-tinta/40 transition-colors hover:text-terracota disabled:opacity-30"
                aria-label="Quitar ingrediente"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addIng}
          className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-terracota hover:text-terracota-ink"
        >
          <Plus className="h-4 w-4" /> Agregar ingrediente
        </button>
      </div>

      <div>
        <label className="etiqueta" htmlFor="instrucciones">
          Instrucciones
        </label>
        <textarea
          id="instrucciones"
          className="campo min-h-32 resize-y"
          value={instrucciones}
          onChange={(e) => setInstrucciones(e.target.value)}
          placeholder="Paso a paso…"
        />
      </div>

      {error && (
        <p className="rounded-xl bg-terracota/10 px-4 py-2.5 text-sm text-terracota-ink">
          {error}
        </p>
      )}

      <div className="flex gap-3 pt-2">
        <button type="submit" className="btn" disabled={pending}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {receta ? "Guardar cambios" : "Crear receta"}
        </button>
        <button
          type="button"
          className="btn-ghost"
          onClick={() => router.back()}
          disabled={pending}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
