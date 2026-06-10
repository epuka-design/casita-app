"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2, Check, X, Sparkles } from "lucide-react";
import { procesarPlan, confirmarPlan, type PreviewPlan } from "./actions";
import type { ImagenPlan } from "./ai";

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// Comprime una imagen del celu a JPEG ~1280px (base64 sin prefijo).
async function comprimir(file: File): Promise<ImagenPlan> {
  const dataUrl = await new Promise<string>((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(fr.result as string);
    fr.onerror = rej;
    fr.readAsDataURL(file);
  });
  const img = await new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = dataUrl;
  });
  const max = 1280;
  const escala = Math.min(1, max / Math.max(img.width, img.height));
  const w = Math.round(img.width * escala);
  const h = Math.round(img.height * escala);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
  const jpeg = canvas.toDataURL("image/jpeg", 0.72);
  return { media_type: "image/jpeg", data: jpeg.split(",")[1] };
}

export function PlanUploader() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [estado, setEstado] = useState<"idle" | "leyendo" | "preview">("idle");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewPlan | null>(null);

  async function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    setEstado("leyendo");
    try {
      const imagenes = await Promise.all(Array.from(files).map(comprimir));
      const res = await procesarPlan(imagenes);
      if (!res.ok) {
        setError(res.error);
        setEstado("idle");
      } else {
        setPreview(res.preview);
        setEstado("preview");
      }
    } catch {
      setError("No pude procesar las fotos. Probá de nuevo.");
      setEstado("idle");
    }
  }

  async function confirmar() {
    if (!preview) return;
    setError(null);
    setGuardando(true);
    const res = await confirmarPlan(preview);
    setGuardando(false);
    if (!res.ok) {
      setError(res.error);
    } else {
      setPreview(null);
      setEstado("idle");
      router.refresh();
    }
  }

  if (estado === "leyendo") {
    return (
      <div className="carta flex flex-col items-center gap-3 py-10 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-terracota" />
        <p className="font-serif text-xl">Leyendo el plan…</p>
        <p className="text-sm text-tinta/50">Claude está extrayendo el menú y las cantidades.</p>
      </div>
    );
  }

  if (estado === "preview" && preview) {
    const { plan, consolidado } = preview;
    return (
      <div className="space-y-4">
        <div className="carta">
          <h2 className="mb-1 font-serif text-xl">Revisá antes de confirmar</h2>
          <p className="subtitulo mb-4">
            {plan.dias.length} días · {consolidado.lista.length} items de súper
          </p>

          <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-tinta/50">
            Menú
          </h3>
          <ul className="mb-4 divide-y divide-tinta/5 text-sm">
            {plan.dias.map((d, i) => (
              <li key={i} className="py-2">
                <span className="font-medium">{d.dia}</span>
                <div className="text-tinta/60">
                  🍽 {d.almuerzo.nombre} · 🌙 {d.cena.nombre}
                </div>
              </li>
            ))}
          </ul>

          <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-tinta/50">
            Lista del súper
          </h3>
          <ul className="space-y-1 text-sm text-tinta/70">
            {consolidado.lista.slice(0, 8).map((it, i) => (
              <li key={i}>
                • {it.nombre} — {it.cantidad_total} {it.unidad}{" "}
                <span className="text-tinta/40">({it.categoria})</span>
              </li>
            ))}
            {consolidado.lista.length > 8 && (
              <li className="text-tinta/40">…y {consolidado.lista.length - 8} más</li>
            )}
          </ul>
        </div>

        {error && (
          <p className="rounded-xl bg-terracota/10 px-4 py-2.5 text-sm text-terracota-ink">
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={confirmar}
            disabled={guardando}
            className="btn"
          >
            {guardando ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            Confirmar y generar
          </button>
          <button
            type="button"
            onClick={() => {
              setPreview(null);
              setEstado("idle");
            }}
            disabled={guardando}
            className="btn-ghost"
          >
            <X className="h-4 w-4" /> Descartar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => onFiles(e.target.files)}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex w-full flex-col items-center gap-2 rounded-xl2 border-2 border-dashed border-terracota/30 bg-terracota/5 px-6 py-10 text-center transition-colors hover:bg-terracota/10"
      >
        <span className="grid h-14 w-14 place-items-center rounded-full bg-terracota text-blanco">
          <Camera className="h-7 w-7" />
        </span>
        <span className="font-serif text-xl text-tinta">Subir foto del plan</span>
        <span className="inline-flex items-center gap-1 text-sm text-tinta/50">
          <Sparkles className="h-3.5 w-3.5" /> Claude lo lee y arma todo
        </span>
        <span className="text-xs text-tinta/40">Podés subir varias hojas juntas</span>
      </button>
      {error && (
        <p className="mt-3 rounded-xl bg-terracota/10 px-4 py-2.5 text-sm text-terracota-ink">
          {error}
        </p>
      )}
    </div>
  );
}

export { cap };
