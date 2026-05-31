import Link from "next/link";
import { SignedIn, SignedOut } from "@clerk/nextjs";

export default function Landing() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <p className="subtitulo mb-3 uppercase tracking-[0.2em]">Gestión del hogar</p>
      <h1 className="font-serif text-6xl font-semibold text-terracota">Casita</h1>
      <p className="mt-4 max-w-sm text-tinta/60">
        Menús, recetas, lista del súper y tareas. Todo el ritmo de la casa en
        un solo lugar.
      </p>

      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <SignedOut>
          <Link href="/sign-in" className="btn">
            Entrar
          </Link>
          <Link href="/sign-up" className="btn-ghost">
            Crear cuenta
          </Link>
        </SignedOut>
        <SignedIn>
          <Link href="/dashboard" className="btn">
            Ir a mi casa
          </Link>
        </SignedIn>
      </div>
    </main>
  );
}
