import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { roleFromMetadata } from "@/lib/roles";
import { navItemsForRole } from "@/components/nav-config";

export default async function DashboardPage() {
  const user = await currentUser();
  const role = roleFromMetadata(
    user?.publicMetadata as { rol?: unknown } | undefined
  );
  const nombre = user?.firstName ?? "👋";

  // Accesos rápidos: las secciones del rol salvo Inicio.
  const accesos = navItemsForRole(role).filter(
    (i) => i.href !== "/dashboard"
  );

  return (
    <div>
      <header className="mb-8">
        <p className="subtitulo uppercase tracking-[0.2em]">Hoy en casa</p>
        <h1 className="titulo mt-1 text-4xl">Hola, {nombre}</h1>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {accesos.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="carta flex flex-col gap-3 transition-transform hover:-translate-y-0.5"
            >
              <Icon
                className="h-6 w-6 text-terracota"
                strokeWidth={1.6}
              />
              <span className="font-serif text-xl">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
