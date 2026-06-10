"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Share2 } from "lucide-react";
import { CATEGORIAS_PLAN } from "@/lib/categorias";
import type { ListaSuperItemRow } from "@/types/database";
import { tildarItemPlan } from "./actions";

type Filtro = "todo" | "pendientes";

export function PlanListaSuper({ items }: { items: ListaSuperItemRow[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [override, setOverride] = useState<Record<string, boolean>>({});
  const [filtro, setFiltro] = useState<Filtro>("todo");

  const tildadoDe = (it: ListaSuperItemRow) => override[it.id] ?? it.tildado;

  function toggle(it: ListaSuperItemRow) {
    const next = !tildadoDe(it);
    setOverride((o) => ({ ...o, [it.id]: next }));
    startTransition(async () => {
      const res = await tildarItemPlan(it.id, next);
      if (!res.ok) setOverride((o) => ({ ...o, [it.id]: !next }));
    });
  }

  const cantidad = (it: ListaSuperItemRow) =>
    [it.cantidad_total, it.unidad].filter(Boolean).join(" ");

  function compartir() {
    const orden = [...CATEGORIAS_PLAN];
    const cats = orden.filter((c) => items.some((i) => i.categoria === c));
    for (const i of items) if (!cats.includes(i.categoria as never)) cats.push(i.categoria as never);
    const lines: string[] = ["*Lista del súper — Plan nutricional*", ""];
    for (const cat of cats) {
      lines.push(`*${cat}*`);
      for (const it of items.filter((i) => i.categoria === cat)) {
        const mark = tildadoDe(it) ? "✅" : "▫️";
        const q = cantidad(it) ? ` — ${cantidad(it)}` : "";
        lines.push(`${mark} ${it.nombre}${q}`);
      }
      lines.push("");
    }
    window.open(
      `https://wa.me/?text=${encodeURIComponent(lines.join("\n").trim())}`,
      "_blank"
    );
  }

  if (items.length === 0) {
    return (
      <div className="carta text-tinta/50">Todavía no hay lista cargada.</div>
    );
  }

  const total = items.length;
  const hechos = items.filter(tildadoDe).length;

  // Orden de categorías: carnes y proteínas primero.
  const cats: string[] = [];
  for (const c of CATEGORIAS_PLAN) if (items.some((i) => i.categoria === c)) cats.push(c);
  for (const i of items) if (!cats.includes(i.categoria)) cats.push(i.categoria);

  const visibles = (cat: string) =>
    items.filter(
      (i) => i.categoria === cat && (filtro === "todo" || !tildadoDe(i))
    );

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-full bg-blanco p-1 shadow-suave">
          {(["todo", "pendientes"] as Filtro[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFiltro(f)}
              className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                filtro === f ? "bg-terracota text-blanco" : "text-tinta/60"
              }`}
            >
              {f === "todo" ? "Todo" : "Pendientes"}
            </button>
          ))}
        </div>
        <button type="button" onClick={compartir} className="btn-ghost">
          <Share2 className="h-4 w-4" /> Compartir
        </button>
      </div>

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

      <div className="space-y-4">
        {cats.map((cat) => {
          const lista = visibles(cat);
          if (lista.length === 0) return null;
          return (
            <section key={cat}>
              <h3 className="mb-2 font-serif text-lg text-tinta/80">{cat}</h3>
              <ul className="overflow-hidden rounded-xl2 bg-blanco shadow-suave">
                {lista.map((it) => {
                  const done = tildadoDe(it);
                  return (
                    <li key={it.id} className="border-b border-tinta/5 last:border-0">
                      <button
                        type="button"
                        onClick={() => toggle(it)}
                        aria-pressed={done}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left"
                      >
                        <span
                          className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl border-2 transition-colors ${
                            done ? "border-verde bg-verde text-blanco" : "border-tinta/20"
                          }`}
                        >
                          {done && <Check className="h-5 w-5" strokeWidth={3} />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span
                            className={`block text-sm font-medium ${
                              done ? "text-tinta/40 line-through" : ""
                            }`}
                          >
                            {it.nombre}
                            {cantidad(it) && (
                              <span className="text-tinta/50"> — {cantidad(it)}</span>
                            )}
                          </span>
                          {it.detalle && (
                            <span className="block text-xs text-tinta/40">
                              {it.detalle}
                            </span>
                          )}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
