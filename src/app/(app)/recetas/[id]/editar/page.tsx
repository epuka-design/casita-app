import { notFound } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { requireRole } from "@/lib/auth";
import { getReceta } from "@/features/recetas/queries";
import { RecetaForm } from "@/features/recetas/RecetaForm";

export default async function EditarRecetaPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await requireRole("admin");
  const receta = await getReceta(user.hogar_id, params.id);
  if (!receta) notFound();

  return (
    <div>
      <PageHeader titulo="Editar receta" subtitulo={receta.nombre} />
      <RecetaForm receta={receta} />
    </div>
  );
}
