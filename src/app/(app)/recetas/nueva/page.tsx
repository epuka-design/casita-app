import { PageHeader } from "@/components/PageHeader";
import { requireRole } from "@/lib/auth";
import { RecetaForm } from "@/features/recetas/RecetaForm";

export default async function NuevaRecetaPage() {
  await requireRole("admin");

  return (
    <div>
      <PageHeader titulo="Nueva receta" subtitulo="Sumala al Banco de Recetas" />
      <RecetaForm />
    </div>
  );
}
