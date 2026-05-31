import { PageHeader } from "@/components/PageHeader";
import { requireHogar } from "@/lib/auth";
import { getLista } from "@/features/super/queries";
import { getEstadoSemana } from "@/features/menu/queries";
import { inicioSemana } from "@/features/menu/logic";
import { recordatorioSuper, inicioMes, mesLabel } from "@/features/super/dias";
import { SuperApp } from "@/features/super/SuperApp";

export default async function SuperPage() {
  const user = await requireHogar();
  const semana = inicioSemana();
  const mes = inicioMes();

  const [semanal, mensual, menuEstado] = await Promise.all([
    getLista(user.hogar_id, "semanal", semana),
    getLista(user.hogar_id, "mensual", mes),
    getEstadoSemana(user.hogar_id, semana),
  ]);

  return (
    <div>
      <PageHeader titulo="Lista del súper" subtitulo="Mensual y semanal" />
      <SuperApp
        rol={user.rol}
        recordatorio={recordatorioSuper()}
        semana={semana}
        mes={mes}
        semanal={semanal}
        mensual={mensual}
        menuAprobado={menuEstado === "aprobado"}
        mensualLabel={mesLabel(mes)}
      />
    </div>
  );
}
