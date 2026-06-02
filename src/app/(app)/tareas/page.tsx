import Link from "next/link";
import { Settings2 } from "lucide-react";
import { requireHogar } from "@/lib/auth";
import { getTareasDeHoy } from "@/features/tareas/queries";
import { TareasHoy } from "@/features/tareas/TareasHoy";

export default async function TareasPage() {
  const user = await requireHogar();
  const { fechaLabel, tareas } = await getTareasDeHoy(user.hogar_id, user.id);

  return (
    <div>
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="text-base text-tinta/50">{fechaLabel}</p>
          <h1 className="mt-1 font-serif text-4xl font-medium text-tinta sm:text-5xl">
            Mis tareas de hoy
          </h1>
        </div>
        {user.rol === "admin" && (
          <Link
            href="/tareas/gestionar"
            className="btn-ghost shrink-0"
            aria-label="Gestionar tareas"
          >
            <Settings2 className="h-4 w-4" /> Gestionar
          </Link>
        )}
      </header>

      <TareasHoy tareas={tareas} />
    </div>
  );
}
