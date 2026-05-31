import Link from "next/link";
import { ensureUser } from "@/lib/auth";
import { navItemsForRole } from "@/components/nav-config";
import { getAdminDashboard } from "@/features/dashboard/data";
import { AdminDashboard } from "@/features/dashboard/AdminDashboard";

export default async function DashboardPage() {
  const user = await ensureUser();

  // Pantalla insignia del admin (Yali).
  if (user.rol === "admin") {
    const data = await getAdminDashboard();
    return <AdminDashboard data={data} />;
  }

  // Resto de roles: accesos rápidos simples.
  const accesos = navItemsForRole(user.rol).filter(
    (i) => i.href !== "/dashboard"
  );

  return (
    <div>
      <header className="mb-8">
        <p className="subtitulo uppercase tracking-[0.2em]">Hoy en casa</p>
        <h1 className="titulo mt-1 text-4xl">Hola</h1>
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
              <Icon className="h-6 w-6 text-terracota" strokeWidth={1.6} />
              <span className="font-serif text-xl">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
