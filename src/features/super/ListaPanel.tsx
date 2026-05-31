"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Loader2,
  Send,
  Pencil,
  Plus,
  X,
  Share2,
  Sparkles,
} from "lucide-react";
import type { Role } from "@/lib/roles";
import type { EstadoMenu } from "@/types/database";
import type { SuperItem } from "./queries";
import { textoWhatsApp } from "./compartir";
import {
  generarMensual,
  generarSemanal,
  agregarItem,
  actualizarCantidad,
  quitarItem,
  tildarItem,
  enviarAprobacionSuper,
  aprobarSuper,
  reabrirSuper,
  type SuperResult,
} from "./actions";

type Tipo = "mensual" | "semanal";

const BADGE: Record<EstadoMenu, { label: string; clase: string }> = {
  borrador: { label: "Borrador", clase: "bg-tinta/10 text-tinta/60" },
  pendiente: { label: "Pendiente de aprobación", clase: "bg-terracota/15 text-terracota-ink" },
  aprobado: { label: "Aprobada", clase: "bg-verde/15 text-verde" },
};

export function ListaPanel({
  tipo,
  periodo,
  estado,
  items,
  rol,
  categorias,
  menuAprobado = true,
  tituloCompartir,
}: {
  tipo: Tipo;
  periodo: string;
  estado: EstadoMenu;
  items: SuperItem[];
  rol: Role;
  categorias: readonly string[];
  menuAprobado?: boolean;
  tituloCompartir: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [genLoading, setGenLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [override, setOverride] = useState<Record<string, boolean>>({});
  const [nuevoCat, setNuevoCat] = useState<string>(categorias[0]);
  const [nuevoItem, setNuevoItem] = useState("");
  const [nuevaCant, setNuevaCant] = useState("");

  const esAdmin = rol === "admin";
  const esFamilia = rol === "familia";
  const editable =
    esAdmin || (rol === "ayudante" && tipo === "semanal" && estado !== "aprobado");
  const canApprove = esAdmin && estado !== "aprobado";
  const canReopen = esAdmin && estado === "aprobado";
  const canSend = editable && estado === "borrador" && items.length > 0;

  const tildadoDe = (it: SuperItem) => override[it.id] ?? it.tildado;

  function correr(fn: () => Promise<SuperResult>) {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) setError(res.error);
      else router.refresh();
    });
  }

  async function generar() {
    setError(null);
    setGenLoading(true);
    const res =
      tipo === "mensual"
        ? await generarMensual(periodo)
        : await generarSemanal(periodo);
    setGenLoading(false);
    if (!res.ok) setError(res.error);
    else router.refresh();
  }

  function toggle(it: SuperItem) {
    const next = !tildadoDe(it);
    setOverride((o) => ({ ...o, [it.id]: next }));
    startTransition(async () => {
      const res = await tildarItem(it.id, next);
      if (!res.ok) setOverride((o) => ({ ...o, [it.id]: !next }));
    });
  }

  function agregar(e: React.FormEvent) {
    e.preventDefault();
    if (!nuevoItem.trim()) return;
    const cat = nuevoCat;
    const it = nuevoItem;
    const cant = nuevaCant;
    setNuevoItem("");
    setNuevaCant("");
    correr(() => agregarItem(tipo, periodo, cat, it, cant));
  }

  function compartir() {
    const conTildado = items.map((i) => ({ ...i, tildado: tildadoDe(i) }));
    const texto = textoWhatsApp(tituloCompartir, conTildado);
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, "_blank");
  }

  // Familia: sólo ve la lista aprobada.
  if (esFamilia && estado !== "aprobado") {
    return (
      <div className="carta text-tinta/50">
        La lista todavía no está aprobada.
      </div>
    );
  }

  const total = items.length;
  const hechos = items.filter(tildadoDe).length;

  // Categorías presentes, en orden.
  const cats: string[] = [];
  for (const c of categorias) if (items.some((i) => i.categoria === c)) cats.push(c);
  for (const i of items) if (!cats.includes(i.categoria)) cats.push(i.categoria);

  const badge = BADGE[estado];

  return (
    <div>
      {/* Acciones */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className={`chip ${badge.clase}`}>{badge.label}</span>

        {editable && (
          <button
            type="button"
            onClick={generar}
            disabled={genLoading || pending || (tipo === "semanal" && !menuAprobado)}
            className="btn-ghost"
            title={
              tipo === "semanal" && !menuAprobado
                ? "Primero aprobá el menú de la semana"
                : undefined
            }
          >
            {genLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 text-terracota" />
            )}
            {total > 0 ? "Regenerar" : "Generar"}
          </button>
        )}

        {canSend && (
          <button
            type="button"
            onClick={() => correr(() => enviarAprobacionSuper(tipo, periodo))}
            disabled={pending}
            className="btn-ghost"
          >
            <Send className="h-4 w-4" /> Enviar para aprobación
          </button>
        )}

        {canApprove && items.length > 0 && (
          <button
            type="button"
            onClick={() => correr(() => aprobarSuper(tipo, periodo))}
            disabled={pending}
            className="btn"
          >
            <Check className="h-4 w-4" /> Aprobar
          </button>
        )}

        {canReopen && (
          <button
            type="button"
            onClick={() => correr(() => reabrirSuper(tipo, periodo))}
            disabled={pending}
            className="btn-ghost"
          >
            <Pencil className="h-4 w-4" /> Reabrir
          </button>
        )}

        {total > 0 && (
          <button type="button" onClick={compartir} className="btn-ghost">
            <Share2 className="h-4 w-4" /> Compartir
          </button>
        )}
      </div>

      {error && (
        <p className="mb-4 rounded-xl bg-terracota/10 px-4 py-2.5 text-sm text-terracota-ink">
          {error}
        </p>
      )}

      {tipo === "semanal" && !menuAprobado && total === 0 && (
        <p className="mb-4 text-sm text-tinta/50">
          Aprobá el menú de la semana y después generá la lista.
        </p>
      )}

      {total === 0 ? (
        <div className="carta text-tinta/50">
          {editable
            ? "Lista vacía. Generala o agregá items."
            : "Todavía no hay items."}
        </div>
      ) : (
        <>
          {/* Progreso */}
          <div className="mb-4">
            <div className="mb-1 flex justify-between text-sm text-tinta/60">
              <span>Progreso</span>
              <span>
                {hechos} de {total}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-tinta/10">
              <div
                className="h-full rounded-full bg-verde transition-all"
                style={{ width: `${total ? (hechos / total) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* Items por categoría */}
          <div className="space-y-4">
            {cats.map((cat) => (
              <section key={cat}>
                <h3 className="mb-2 font-serif text-lg text-tinta/80">{cat}</h3>
                <ul className="overflow-hidden rounded-xl2 bg-blanco shadow-suave">
                  {items
                    .filter((i) => i.categoria === cat)
                    .map((it) => {
                      const done = tildadoDe(it);
                      return (
                        <li
                          key={it.id}
                          className="flex items-center gap-3 border-b border-tinta/5 px-4 py-3 last:border-0"
                        >
                          <button
                            type="button"
                            onClick={() => toggle(it)}
                            aria-pressed={done}
                            className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl border-2 transition-colors ${
                              done
                                ? "border-verde bg-verde text-blanco"
                                : "border-tinta/20"
                            }`}
                          >
                            {done && <Check className="h-5 w-5" strokeWidth={3} />}
                          </button>

                          <span
                            className={`flex-1 text-sm ${
                              done ? "text-tinta/40 line-through" : ""
                            }`}
                          >
                            {it.item}
                          </span>

                          {editable ? (
                            <input
                              key={it.id}
                              defaultValue={it.cantidad ?? ""}
                              placeholder="cant."
                              onBlur={(e) => {
                                if (e.target.value !== (it.cantidad ?? ""))
                                  correr(() =>
                                    actualizarCantidad(it.id, tipo, e.target.value)
                                  );
                              }}
                              className="w-20 rounded-lg border border-tinta/10 px-2 py-1 text-right text-xs text-tinta/70 focus:border-terracota/40 focus:outline-none"
                            />
                          ) : (
                            it.cantidad && (
                              <span className="text-xs text-tinta/50">
                                {it.cantidad}
                              </span>
                            )
                          )}

                          {editable && (
                            <button
                              type="button"
                              onClick={() => correr(() => quitarItem(it.id, tipo))}
                              className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-tinta/30 hover:text-terracota"
                              aria-label="Quitar"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </li>
                      );
                    })}
                </ul>
              </section>
            ))}
          </div>
        </>
      )}

      {/* Agregar item */}
      {editable && (
        <form
          onSubmit={agregar}
          className="mt-5 flex flex-wrap items-end gap-2 rounded-xl2 bg-blanco p-4 shadow-suave"
        >
          <div className="min-w-0 flex-1">
            <label className="etiqueta">Item</label>
            <input
              className="campo"
              value={nuevoItem}
              onChange={(e) => setNuevoItem(e.target.value)}
              placeholder="Agregar a la lista…"
            />
          </div>
          <div className="w-24">
            <label className="etiqueta">Cant.</label>
            <input
              className="campo"
              value={nuevaCant}
              onChange={(e) => setNuevaCant(e.target.value)}
            />
          </div>
          <div className="w-40">
            <label className="etiqueta">Categoría</label>
            <select
              className="campo"
              value={nuevoCat}
              onChange={(e) => setNuevoCat(e.target.value)}
            >
              {categorias.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn" disabled={pending}>
            <Plus className="h-4 w-4" /> Agregar
          </button>
        </form>
      )}
    </div>
  );
}
