import { PageHeader } from "@/components/PageHeader";

export default function MenuPage() {
  return (
    <div>
      <PageHeader
        titulo="Menú semanal"
        subtitulo="Qué se cocina cada día"
        action={<button className="btn">Armar semana</button>}
      />
      <div className="carta text-tinta/50">
        Todavía no hay menú cargado para esta semana.
      </div>
    </div>
  );
}
