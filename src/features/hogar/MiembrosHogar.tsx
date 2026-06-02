"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Copy, Check, Share2, UserMinus, Loader2 } from "lucide-react";
import { ROLES, ROLE_LABEL, type Role } from "@/lib/roles";
import type { Miembro } from "./queries";
import { cambiarRol, quitarMiembro, type HogarResult } from "./actions";

export function MiembrosHogar({
  codigo,
  hogarNombre,
  miembros,
  currentUserId,
}: {
  codigo: string;
  hogarNombre: string;
  miembros: Miembro[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  function correr(fn: () => Promise<HogarResult>) {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) setError(res.error);
      else router.refresh();
    });
  }

  function copiar() {
    navigator.clipboard?.writeText(codigo);
    setCopiado(true);
  }

  function compartir() {
    const origin =
      typeof window !== "undefined" ? window.location.origin : "";
    const texto = `Te invito a "${hogarNombre}" en Casita 🏡\nEntrá a ${origin} y unite con el código: ${codigo}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, "_blank");
  }

  return (
    <div className="space-y-5">
      {/* Código de invitación */}
      <div className="carta">
        <h2 className="mb-1 font-serif text-xl">Código de invitación</h2>
        <p className="subtitulo mb-4">
          Compartilo para que se sumen a <strong>{hogarNombre}</strong>.
        </p>
        <div className="rounded-xl2 bg-crema px-5 py-4">
          <span className="block whitespace-nowrap text-center font-serif text-3xl tracking-wide text-terracota">
            {codigo}
          </span>
          <div className="mt-4 flex gap-2">
            <button type="button" onClick={copiar} className="btn-ghost flex-1">
              {copiado ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copiado ? "Copiado" : "Copiar"}
            </button>
            <button type="button" onClick={compartir} className="btn flex-1">
              <Share2 className="h-4 w-4" /> Compartir
            </button>
          </div>
        </div>
      </div>

      {/* Miembros */}
      <div className="carta">
        <h2 className="mb-4 font-serif text-xl">Miembros del hogar</h2>
        {error && (
          <p className="mb-3 rounded-xl bg-terracota/10 px-4 py-2 text-sm text-terracota-ink">
            {error}
          </p>
        )}
        <ul className="divide-y divide-tinta/5">
          {miembros.map((m) => {
            const soyYo = m.id === currentUserId;
            return (
              <li key={m.id} className="flex items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {m.nombre}
                    {soyYo && <span className="text-tinta/40"> (vos)</span>}
                  </p>
                  <p className="truncate text-xs text-tinta/50">{m.email}</p>
                </div>

                {soyYo ? (
                  <span className="chip bg-terracota/10 text-terracota-ink">
                    {ROLE_LABEL[m.rol]}
                  </span>
                ) : (
                  <>
                    <select
                      value={m.rol}
                      disabled={pending}
                      onChange={(e) =>
                        correr(() => cambiarRol(m.id, e.target.value as Role))
                      }
                      className="rounded-lg border border-tinta/10 bg-blanco px-2 py-1 text-sm focus:border-terracota/40 focus:outline-none"
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {ROLE_LABEL[r]}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => correr(() => quitarMiembro(m.id))}
                      disabled={pending}
                      className="grid h-8 w-8 place-items-center rounded-lg text-tinta/30 hover:text-terracota"
                      aria-label={`Sacar a ${m.nombre}`}
                    >
                      {pending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <UserMinus className="h-4 w-4" />
                      )}
                    </button>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
