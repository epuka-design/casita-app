"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2 } from "lucide-react";
import { completarReceta } from "./actions";

export function CompletarRecetaButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="mb-6">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const res = await completarReceta(id);
            if (!res.ok) setError(res.error);
            else router.refresh();
          });
        }}
        className="btn"
      >
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
        Completar con IA
      </button>
      {error && (
        <p className="mt-2 rounded-xl bg-terracota/10 px-4 py-2 text-sm text-terracota-ink">
          {error}
        </p>
      )}
    </div>
  );
}
