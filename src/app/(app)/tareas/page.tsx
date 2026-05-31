import { requireHogar } from "@/lib/auth";
import { getTareasDeHoy } from "@/features/tareas/queries";
import { TareasHoy } from "@/features/tareas/TareasHoy";

export default async function TareasPage() {
  const user = await requireHogar();
  const { fechaLabel, tareas } = await getTareasDeHoy(user.hogar_id);

  return (
    <div>
      <header className="mb-8">
        <p className="text-base text-tinta/50">{fechaLabel}</p>
        <h1 className="mt-1 font-serif text-4xl font-medium text-tinta sm:text-5xl">
          Mis tareas de hoy
        </h1>
      </header>

      <TareasHoy tareas={tareas} />
    </div>
  );
}
