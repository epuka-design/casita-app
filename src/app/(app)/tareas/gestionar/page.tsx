import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { requireRole } from "@/lib/auth";
import { getTareasCatalogo } from "@/features/tareas/queries";
import { getMiembros } from "@/features/hogar/queries";
import { GestionTareas } from "@/features/tareas/GestionTareas";

export default async function GestionarTareasPage() {
  const user = await requireRole("admin");
  const [tareas, miembros] = await Promise.all([
    getTareasCatalogo(user.hogar_id),
    getMiembros(user.hogar_id),
  ]);

  return (
    <div>
      <Link href="/tareas" className="text-sm text-tinta/50 hover:text-terracota">
        ← Mis tareas
      </Link>
      <PageHeader
        titulo="Gestionar tareas"
        subtitulo="Creá, editá y asigná las tareas de la casa"
      />
      <GestionTareas tareas={tareas} miembros={miembros} />
    </div>
  );
}
