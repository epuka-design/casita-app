"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2, Check, Send, Pencil, X, AlertTriangle } from "lucide-react";
import { MENU_TIPO_LABEL, type MenuTipo } from "@/lib/categorias";
import type { Role } from "@/lib/roles";
import type { EstadoMenu } from "@/types/database";
import type { RecetaMin } from "./ai";
import type { DiaView } from "./MenuView";
import { RecipePicker } from "./RecipePicker";
import {
  setPlato,
  enviarAprobacion,
  aprobarMenu,
  reabrirMenu,
  sugerirMenuAction,
  crearComidaYAsignar,
  type MenuResult,
} from "./actions";

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const ESTADO_BADGE: Record<EstadoMenu, { label: string; clase: string }> = {
  borrador: { label: "Borrador", clase: "bg-tinta/10 text-tinta/60" },
  pendiente: { label: "Pendiente de aprobación", clase: "bg-terracota/15 text-terracota-ink" },
  aprobado: { label: "Aprobado", clase: "bg-verde/15 text-verde" },
};

export function MenuBuilder({
  semana,
  estado,
  dias,
  recetas,
  rol,
  editable,
  warnings,
}: {
  semana: string;
  estado: EstadoMenu;
  dias: DiaView[];
  recetas: RecetaMin[];
  rol: Role;
  editable: boolean;
  warnings: string[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [iaLoading, setIaLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [picker, setPicker] = useState<{ dia: string; tipo: MenuTipo } | null>(
    null
  );

  function correr(fn: () => Promise<MenuResult>) {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) setError(res.error);
      else router.refresh();
    });
  }

  function elegir(recetaId: string) {
    if (!picker) return;
    const { dia, tipo } = picker;
    setPicker(null);
    correr(() => setPlato(semana, dia, tipo, recetaId));
  }

  function quitar(dia: string, tipo: MenuTipo) {
    correr(() => setPlato(semana, dia, tipo, null));
  }

  function crearNueva(nombre: string) {
    if (!picker) return;
    const { dia, tipo } = picker;
    setPicker(null);
    correr(() => crearComidaYAsignar(semana, dia, tipo, nombre));
  }

  async function sugerir() {
    setError(null);
    setIaLoading(true);
    const res = await sugerirMenuAction(semana);
    setIaLoading(false);
    if (!res.ok) setError(res.error);
    else router.refresh();
  }

  const badge = ESTADO_BADGE[estado];

  return (
    <div>
      {/* Estado + acciones */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <span className={`chip ${badge.clase}`}>{badge.label}</span>

        {editable && recetas.length > 0 && (
          <button
            type="button"
            onClick={sugerir}
            disabled={iaLoading || pending}
            className="btn-ghost"
          >
            {iaLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 text-terracota" />
            )}
            Sugerí menú
          </button>
        )}

        {editable && estado === "borrador" && (
          <button
            type="button"
            onClick={() => correr(() => enviarAprobacion(semana))}
            disabled={pending}
            className="btn-ghost"
          >
            <Send className="h-4 w-4" /> Enviar para aprobación
          </button>
        )}

        {rol === "admin" && estado !== "aprobado" && (
          <button
            type="button"
            onClick={() => correr(() => aprobarMenu(semana))}
            disabled={pending}
            className="btn"
          >
            <Check className="h-4 w-4" /> Aprobar menú
          </button>
        )}

        {rol === "admin" && estado === "aprobado" && (
          <button
            type="button"
            onClick={() => correr(() => reabrirMenu(semana))}
            disabled={pending}
            className="btn-ghost"
          >
            <Pencil className="h-4 w-4" /> Reabrir para editar
          </button>
        )}
      </div>

      {error && (
        <p className="mb-4 rounded-xl bg-terracota/10 px-4 py-2.5 text-sm text-terracota-ink">
          {error}
        </p>
      )}

      {/* Warnings (no bloquean) */}
      {warnings.length > 0 && (
        <div className="mb-5 rounded-xl2 border border-terracota/20 bg-terracota/5 p-4">
          <p className="mb-2 flex items-center gap-2 text-sm font-medium text-terracota-ink">
            <AlertTriangle className="h-4 w-4" /> Para revisar antes de aprobar
          </p>
          <ul className="space-y-1 text-sm text-tinta/70">
            {warnings.map((w, i) => (
              <li key={i}>• {w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Grilla de días */}
      <ul className="space-y-3">
        {dias.map((d) => (
          <li key={d.dia} className="carta">
            <h3 className="mb-3 font-serif text-xl">{cap(d.dia)}</h3>
            <div className="space-y-2">
              {(["almuerzo", "cena"] as MenuTipo[]).map((tipo) => {
                const slot = d[tipo];
                return (
                  <div key={tipo} className="flex items-center gap-3 text-sm">
                    <span className="w-20 shrink-0 text-tinta/50">
                      {MENU_TIPO_LABEL[tipo]}
                    </span>
                    {editable ? (
                      <div className="flex flex-1 items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setPicker({ dia: d.dia, tipo })}
                          className={`flex-1 rounded-xl border border-tinta/10 px-3 py-2 text-left transition-colors hover:border-terracota/40 ${
                            slot.nombre ? "" : "text-tinta/30"
                          }`}
                        >
                          {slot.nombre ?? "Elegir receta…"}
                        </button>
                        {slot.recetaId && (
                          <button
                            type="button"
                            onClick={() => quitar(d.dia, tipo)}
                            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-tinta/40 hover:text-terracota"
                            aria-label="Quitar"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ) : (
                      <span className={slot.nombre ? "" : "text-tinta/30"}>
                        {slot.nombre ?? "Sin asignar"}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </li>
        ))}
      </ul>

      {picker && (
        <RecipePicker
          recetas={recetas}
          titulo={`${MENU_TIPO_LABEL[picker.tipo]} · ${cap(picker.dia)}`}
          onPick={elegir}
          onClose={() => setPicker(null)}
          onCrear={crearNueva}
        />
      )}
    </div>
  );
}
