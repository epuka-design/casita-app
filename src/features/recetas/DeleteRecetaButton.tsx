"use client";

import { useState, useTransition } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { eliminarReceta } from "./actions";

export function DeleteRecetaButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  const [confirmando, setConfirmando] = useState(false);

  if (!confirmando) {
    return (
      <button
        type="button"
        onClick={() => setConfirmando(true)}
        className="btn-ghost text-terracota"
      >
        <Trash2 className="h-4 w-4" /> Eliminar
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-tinta/60">¿Seguro?</span>
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => void eliminarReceta(id))}
        className="btn bg-terracota"
      >
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        Sí, eliminar
      </button>
      <button
        type="button"
        className="btn-ghost"
        onClick={() => setConfirmando(false)}
        disabled={pending}
      >
        No
      </button>
    </div>
  );
}
