"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Home, Users, Copy, Check, ArrowRight } from "lucide-react";
import { crearHogar, unirseHogar } from "./onboarding-actions";

type Modo = "elegir" | "crear" | "unirse";

export function Onboarding() {
  const router = useRouter();
  const [modo, setModo] = useState<Modo>("elegir");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [nombre, setNombre] = useState("");
  const [codigo, setCodigo] = useState("");
  const [creado, setCreado] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  function crear(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await crearHogar(nombre);
      if (!res.ok) setError(res.error);
      else setCreado(res.codigo); // mostramos el código antes de entrar
    });
  }

  function unirse(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await unirseHogar(codigo);
      if (!res.ok) setError(res.error);
      else {
        router.push("/dashboard");
        router.refresh();
      }
    });
  }

  // Pantalla final: código creado para compartir.
  if (creado) {
    return (
      <Card>
        <h1 className="font-serif text-3xl text-tinta">¡Hogar creado! 🎉</h1>
        <p className="mt-2 text-tinta/60">
          Compartí este código con tu familia para que se sumen:
        </p>
        <div className="mt-4 flex items-center justify-between gap-3 rounded-xl2 bg-crema px-5 py-4">
          <span className="font-serif text-2xl tracking-wide text-terracota">
            {creado}
          </span>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(creado);
              setCopiado(true);
            }}
            className="btn-ghost"
          >
            {copiado ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copiado ? "Copiado" : "Copiar"}
          </button>
        </div>
        <button
          type="button"
          onClick={() => {
            router.push("/dashboard");
            router.refresh();
          }}
          className="btn mt-6 w-full"
        >
          Entrar a mi casa <ArrowRight className="h-4 w-4" />
        </button>
      </Card>
    );
  }

  if (modo === "elegir") {
    return (
      <Card>
        <p className="text-xs uppercase tracking-[0.22em] text-tinta/40">
          Bienvenida a Casita
        </p>
        <h1 className="mt-1 font-serif text-3xl text-tinta">
          ¿Empezamos tu hogar?
        </h1>
        <p className="mt-2 text-tinta/60">
          Creá un hogar nuevo o unite a uno con un código de invitación.
        </p>
        <div className="mt-6 space-y-3">
          <button
            type="button"
            onClick={() => setModo("crear")}
            className="flex w-full items-center gap-3 rounded-xl2 bg-blanco p-4 text-left shadow-suave transition-transform hover:-translate-y-0.5"
          >
            <span className="grid h-10 w-10 place-items-center rounded-full bg-terracota/10">
              <Home className="h-5 w-5 text-terracota" />
            </span>
            <span>
              <span className="block font-medium">Crear un hogar</span>
              <span className="block text-sm text-tinta/50">
                Quedás como administrador/a
              </span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => setModo("unirse")}
            className="flex w-full items-center gap-3 rounded-xl2 bg-blanco p-4 text-left shadow-suave transition-transform hover:-translate-y-0.5"
          >
            <span className="grid h-10 w-10 place-items-center rounded-full bg-verde/10">
              <Users className="h-5 w-5 text-verde" />
            </span>
            <span>
              <span className="block font-medium">Unirme a un hogar</span>
              <span className="block text-sm text-tinta/50">
                Con un código de invitación
              </span>
            </span>
          </button>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <button
        type="button"
        onClick={() => {
          setModo("elegir");
          setError(null);
        }}
        className="mb-3 text-sm text-tinta/50 hover:text-terracota"
      >
        ← Volver
      </button>

      {modo === "crear" ? (
        <form onSubmit={crear}>
          <h1 className="font-serif text-3xl text-tinta">Crear un hogar</h1>
          <label className="etiqueta mt-5">Nombre del hogar</label>
          <input
            className="campo"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Casa de los Pukall"
            autoFocus
          />
          {error && <Err msg={error} />}
          <button type="submit" className="btn mt-5 w-full" disabled={pending}>
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            Crear hogar
          </button>
        </form>
      ) : (
        <form onSubmit={unirse}>
          <h1 className="font-serif text-3xl text-tinta">Unirme a un hogar</h1>
          <label className="etiqueta mt-5">Código de invitación</label>
          <input
            className="campo uppercase"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            placeholder="CASA-7Q3X"
            autoFocus
          />
          {error && <Err msg={error} />}
          <button type="submit" className="btn mt-5 w-full" disabled={pending}>
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            Unirme
          </button>
        </form>
      )}
    </Card>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-dvh items-center justify-center px-5 py-10">
      <div className="w-full max-w-md rounded-xl2 bg-blanco p-7 shadow-carta">
        {children}
      </div>
    </main>
  );
}

function Err({ msg }: { msg: string }) {
  return (
    <p className="mt-3 rounded-xl bg-terracota/10 px-4 py-2.5 text-sm text-terracota-ink">
      {msg}
    </p>
  );
}
