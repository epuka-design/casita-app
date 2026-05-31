import { PageHeader } from "@/components/PageHeader";

export default function SuperPage() {
  return (
    <div>
      <PageHeader
        titulo="Lista del súper"
        subtitulo="Lo que falta en casa"
        action={<button className="btn">Agregar ítem</button>}
      />
      <div className="carta text-tinta/50">
        La lista está vacía. ¡Buena señal!
      </div>
    </div>
  );
}
