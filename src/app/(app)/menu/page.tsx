import { PageHeader } from "@/components/PageHeader";
import { requireHogar } from "@/lib/auth";
import { getRecetas } from "@/features/recetas/queries";
import { getMenuSemana } from "@/features/menu/queries";
import { inicioSemana, semanaLabel, calcularWarnings, DIAS_SEMANA } from "@/features/menu/logic";
import { MenuView, type DiaView } from "@/features/menu/MenuView";
import { MenuBuilder } from "@/features/menu/MenuBuilder";
import type { RecetaRow } from "@/types/database";

// "Sugerí menú" llama a la IA → subimos el límite de tiempo.
export const maxDuration = 60;

export default async function MenuPage() {
  const user = await requireHogar();
  const semana = inicioSemana();
  const label = semanaLabel(semana);

  const [recetas, menu] = await Promise.all([
    getRecetas(user.hogar_id),
    getMenuSemana(user.hogar_id, semana),
  ]);

  const porId = new Map<string, RecetaRow>(recetas.map((r) => [r.id, r]));
  const resolver = (recetaId?: string) => {
    const r = recetaId ? porId.get(recetaId) : undefined;
    return {
      recetaId: r?.id ?? null,
      nombre: r?.nombre ?? null,
      categoria: r?.categoria ?? null,
    };
  };

  const dias: DiaView[] = DIAS_SEMANA.map((dia) => ({
    dia,
    almuerzo: resolver(menu.slots[`${dia}|almuerzo`]),
    cena: resolver(menu.slots[`${dia}|cena`]),
  }));

  const esEditor = user.rol === "admin" || user.rol === "ayudante";

  // Vista del marido (familia): solo el menú aprobado.
  if (!esEditor) {
    return (
      <div>
        <PageHeader titulo="Menú de la semana" subtitulo={label} />
        {menu.estado === "aprobado" ? (
          <MenuView dias={dias} />
        ) : (
          <div className="carta text-tinta/50">
            El menú de esta semana todavía no está aprobado.
          </div>
        )}
      </div>
    );
  }

  const warnings = calcularWarnings(dias);
  const editable = user.rol === "admin" || menu.estado !== "aprobado";
  const recetasMin = recetas.map((r) => ({
    id: r.id,
    nombre: r.nombre,
    categoria: r.categoria,
  }));

  return (
    <div>
      <PageHeader titulo="Menú de la semana" subtitulo={label} />
      <MenuBuilder
        semana={semana}
        estado={menu.estado}
        dias={dias}
        recetas={recetasMin}
        rol={user.rol}
        editable={editable}
        warnings={warnings}
      />
    </div>
  );
}
