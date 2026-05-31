import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { requireHogar } from "@/lib/auth";
import { getRecetas } from "@/features/recetas/queries";
import { RecetasLista } from "@/features/recetas/RecetasLista";

export default async function RecetasPage() {
  const user = await requireHogar();
  const esAdmin = user.rol === "admin";
  const recetas = await getRecetas(user.hogar_id);

  return (
    <div>
      <PageHeader
        titulo="Banco de Recetas"
        subtitulo="Todo lo que cocinamos en casa"
        action={
          esAdmin ? (
            <Link href="/recetas/nueva" className="btn">
              <Plus className="h-4 w-4" /> Nueva
            </Link>
          ) : undefined
        }
      />

      {recetas.length === 0 ? (
        <div className="carta text-tinta/50">
          Todavía no hay recetas cargadas.
        </div>
      ) : (
        <RecetasLista recetas={recetas} />
      )}
    </div>
  );
}
