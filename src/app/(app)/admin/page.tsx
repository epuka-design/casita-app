import { PageHeader } from "@/components/PageHeader";
import { requireRole } from "@/lib/auth";
import { getHogar } from "@/lib/hogar";
import { HogarForm } from "@/features/hogar/HogarForm";
import { getItemsFijos } from "@/features/super/queries";
import { ItemsFijos } from "@/features/super/ItemsFijos";
import { getHogarInfo, getMiembros } from "@/features/hogar/queries";
import { MiembrosHogar } from "@/features/hogar/MiembrosHogar";

export default async function AdminPage() {
  // Doble defensa: el middleware ya bloquea no-admins.
  const user = await requireRole("admin");
  const [hogar, fijos, info, miembros] = await Promise.all([
    getHogar(user.hogar_id),
    getItemsFijos(user.hogar_id),
    getHogarInfo(user.hogar_id),
    getMiembros(user.hogar_id),
  ]);

  return (
    <div className="space-y-5">
      <PageHeader titulo="Administración" subtitulo="Configuración de la casa" />

      {info && (
        <MiembrosHogar
          codigo={info.codigo}
          hogarNombre={info.nombre}
          miembros={miembros}
          currentUserId={user.id}
        />
      )}

      <HogarForm
        adultos={hogar.adultos}
        ninos={hogar.ninos}
        factorNino={hogar.factorNino}
      />
      <ItemsFijos items={fijos} />
    </div>
  );
}
