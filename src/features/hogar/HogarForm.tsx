"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check } from "lucide-react";
import { porcionesObjetivo } from "@/lib/cantidades";
import { setHogar } from "./actions";

export function HogarForm({
  adultos: adultosIni,
  ninos: ninosIni,
  factorNino,
}: {
  adultos: number;
  ninos: number;
  factorNino: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [adultos, setAdultos] = useState(adultosIni);
  const [ninos, setNinos] = useState(ninosIni);
  const [estado, setEstado] = useState<"idle" | "ok" | string>("idle");

  const objetivo = porcionesObjetivo(adultos, ninos, factorNino);

  function guardar(e: React.FormEvent) {
    e.preventDefault();
    setEstado("idle");
    startTransition(async () => {
      const res = await setHogar({ adultos, ninos });
      if (res.ok) {
        setEstado("ok");
        router.refresh();
      } else {
        setEstado(res.error);
      }
    });
  }

  return (
    <form onSubmit={guardar} className="carta">
      <h2 className="mb-1 font-serif text-xl">Cuántos comen</h2>
      <p className="subtitulo mb-4">
        Se usa para escalar las cantidades del súper y las porciones.
      </p>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="etiqueta" htmlFor="adultos">
            Adultos
          </label>
          <input
            id="adultos"
            type="number"
            min={1}
            max={20}
            className="campo"
            value={adultos}
            onChange={(e) => setAdultos(Number(e.target.value))}
          />
        </div>
        <div>
          <label className="etiqueta" htmlFor="ninos">
            Niños
          </label>
          <input
            id="ninos"
            type="number"
            min={0}
            max={20}
            className="campo"
            value={ninos}
            onChange={(e) => setNinos(Number(e.target.value))}
          />
        </div>
      </div>

      <p className="mt-3 text-sm text-tinta/60">
        Objetivo:{" "}
        <span className="font-medium text-terracota">{objetivo} porciones</span>{" "}
        <span className="text-tinta/40">(niño = ½ adulto)</span>
      </p>

      {typeof estado === "string" && estado !== "idle" && estado !== "ok" && (
        <p className="mt-3 rounded-xl bg-terracota/10 px-4 py-2 text-sm text-terracota-ink">
          {estado}
        </p>
      )}

      <div className="mt-4 flex items-center gap-3">
        <button type="submit" className="btn" disabled={pending}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          Guardar
        </button>
        {estado === "ok" && (
          <span className="inline-flex items-center gap-1 text-sm text-verde">
            <Check className="h-4 w-4" /> Guardado
          </span>
        )}
      </div>
    </form>
  );
}
