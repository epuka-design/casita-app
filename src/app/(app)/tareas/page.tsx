import { PageHeader } from "@/components/PageHeader";

export default function TareasPage() {
  return (
    <div>
      <PageHeader
        titulo="Tareas"
        subtitulo="El ritmo de la casa"
        action={<button className="btn">Nueva tarea</button>}
      />
      <div className="carta text-tinta/50">
        No hay tareas pendientes por hoy.
      </div>
    </div>
  );
}
