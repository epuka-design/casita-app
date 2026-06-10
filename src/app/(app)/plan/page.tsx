import { PageHeader } from "@/components/PageHeader";
import { requireHogar } from "@/lib/auth";
import { getPlanActual } from "@/features/plan/queries";
import { PlanUploader } from "@/features/plan/PlanUploader";
import { PlanListaSuper } from "@/features/plan/PlanListaSuper";

export default async function PlanPage() {
  const user = await requireHogar();
  const esAdmin = user.rol === "admin";
  const { plan, items } = await getPlanActual(user.hogar_id);

  return (
    <div>
      <PageHeader
        titulo="Plan nutricional"
        subtitulo="De la foto del plan al menú y la lista del súper"
      />

      {esAdmin && (
        <div className="mb-8">
          <PlanUploader />
        </div>
      )}

      {plan ? (
        <section>
          <h2 className="mb-3 font-serif text-2xl">Lista del súper</h2>
          <PlanListaSuper items={items} />
        </section>
      ) : (
        <div className="carta text-tinta/50">
          {esAdmin
            ? "Subí la foto de tu plan para generar el menú y la lista."
            : "Todavía no hay un plan cargado."}
        </div>
      )}
    </div>
  );
}
