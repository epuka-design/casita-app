import { PageHeader } from "@/components/PageHeader";

export default function RecetasPage() {
  return (
    <div>
      <PageHeader
        titulo="Recetas"
        subtitulo="El recetario de la casa"
        action={<button className="btn">Nueva receta</button>}
      />
      <div className="carta text-tinta/50">
        Aún no cargaste recetas.
      </div>
    </div>
  );
}
