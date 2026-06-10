import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, Users, Clock } from "lucide-react";
import { requireHogar } from "@/lib/auth";
import { getHogar } from "@/lib/hogar";
import { getReceta } from "@/features/recetas/queries";
import { DeleteRecetaButton } from "@/features/recetas/DeleteRecetaButton";

export default async function RecetaDetallePage({
  params,
}: {
  params: { id: string };
}) {
  const user = await requireHogar();
  const esAdmin = user.rol === "admin";
  const [receta, hogar] = await Promise.all([
    getReceta(user.hogar_id, params.id),
    getHogar(user.hogar_id),
  ]);
  if (!receta) notFound();

  // Instrucciones como pasos: una línea = un paso.
  const pasos = (receta.instrucciones ?? "")
    .split("\n")
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <article>
      <Link
        href="/recetas"
        className="text-sm text-tinta/50 hover:text-terracota"
      >
        ← Banco de Recetas
      </Link>

      <header className="mb-6 mt-2 flex items-start justify-between gap-4">
        <div>
          <h1 className="titulo">{receta.nombre}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-tinta/50">
            {receta.categoria && (
              <span className="chip">{receta.categoria}</span>
            )}
            {receta.tiempo_min != null && (
              <span className="inline-flex items-center gap-1">
                <Clock className="h-4 w-4" /> {receta.tiempo_min} min
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Users className="h-4 w-4" /> Rinde {receta.porciones}
              {receta.porciones !== hogar.objetivo && (
                <span className="text-tinta/40">
                  · la casa: {hogar.objetivo}
                </span>
              )}
            </span>
          </div>
        </div>
        {esAdmin && (
          <Link href={`/recetas/${receta.id}/editar`} className="btn-ghost">
            <Pencil className="h-4 w-4" /> Editar
          </Link>
        )}
      </header>

      {receta.ingredientes.length > 0 && (
        <section className="carta mb-4">
          <h2 className="mb-3 font-serif text-xl">Ingredientes</h2>
          <ul className="divide-y divide-tinta/5">
            {receta.ingredientes.map((ing, i) => (
              <li key={i} className="flex justify-between py-2 text-sm">
                <span>{ing.nombre}</span>
                <span className="text-tinta/50">{ing.cantidad}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {pasos.length > 0 && (
        <section className="carta mb-6">
          <h2 className="mb-3 font-serif text-xl">Preparación</h2>
          <ol className="space-y-3">
            {pasos.map((paso, i) => (
              <li key={i} className="flex gap-3 text-sm leading-relaxed">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-terracota/10 text-xs font-medium text-terracota">
                  {i + 1}
                </span>
                <span className="text-tinta/80">{paso}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {receta.adaptacion_ninos && (
        <section className="carta mb-6 border border-verde/20 bg-verde/5">
          <h2 className="mb-2 font-serif text-xl text-verde">
            Para los niños
          </h2>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-tinta/80">
            {receta.adaptacion_ninos}
          </p>
        </section>
      )}

      {receta.ingredientes.length === 0 &&
        pasos.length === 0 &&
        !receta.adaptacion_ninos && (
          <div className="carta mb-6 text-tinta/50">
            Esta receta todavía no tiene el detalle cargado.
          </div>
        )}

      {esAdmin && <DeleteRecetaButton id={receta.id} />}
    </article>
  );
}
