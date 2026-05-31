import { PageHeader } from "@/components/PageHeader";

// Doble defensa: el middleware ya bloquea no-admins, pero igual
// confirmamos el rol acá por si se accede sin pasar por el matcher.
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { roleFromMetadata } from "@/lib/roles";

export default async function AdminPage() {
  const user = await currentUser();
  const role = roleFromMetadata(
    user?.publicMetadata as { rol?: unknown } | undefined
  );
  if (role !== "admin") redirect("/dashboard");

  return (
    <div>
      <PageHeader
        titulo="Administración"
        subtitulo="Usuarios, roles y ajustes de la casa"
      />
      <div className="carta text-tinta/50">
        Panel de administración. Sólo visible para el rol admin.
      </div>
    </div>
  );
}
