import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { Navbar } from "@/components/Navbar";
import { roleFromMetadata } from "@/lib/roles";

// Layout de la zona autenticada. El middleware ya bloquea sin sesión;
// acá resolvemos el rol para alimentar la navegación.
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const role = roleFromMetadata(
    user.publicMetadata as { rol?: unknown } | undefined
  );

  return (
    <div className="min-h-dvh">
      <Navbar role={role} />
      <main className="px-5 pb-24 pt-6 md:ml-56 md:px-10 md:pb-10">
        <div className="mx-auto max-w-3xl">{children}</div>
      </main>
    </div>
  );
}
