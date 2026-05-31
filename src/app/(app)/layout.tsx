import { Navbar } from "@/components/Navbar";
import { requireHogar } from "@/lib/auth";
import { getEstadoSemana } from "@/features/menu/queries";
import { inicioSemana } from "@/features/menu/logic";

// Layout de la zona autenticada. El middleware ya bloquea sin sesión;
// `requireHogar` exige que el usuario tenga un hogar (si no, va al onboarding).
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireHogar();
  const role = user.rol;

  // Indicación visual para el admin: ¿hay un menú esperando aprobación?
  const menuPendiente =
    role === "admin" &&
    (await getEstadoSemana(user.hogar_id, inicioSemana())) === "pendiente";

  return (
    <div className="min-h-dvh">
      <Navbar role={role} menuPendiente={menuPendiente} />
      <main className="px-5 pb-24 pt-6 md:ml-56 md:px-10 md:pb-10">
        <div className="mx-auto max-w-3xl">{children}</div>
      </main>
    </div>
  );
}
