import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { roleFromMetadata } from "@/lib/roles";

// Rutas públicas (no requieren sesión).
const isPublicRoute = createRouteMatcher(["/", "/sign-in(.*)", "/sign-up(.*)"]);

// Rutas restringidas por rol. La nav ya las oculta, pero el middleware
// es la defensa real: deep-links / acceso directo por URL.
const isAdminRoute = createRouteMatcher(["/admin(.*)"]);
// El ayudante sólo puede entrar a estas rutas; cualquier otra lo
// devuelve a "Mis tareas". Recetas en modo lectura.
const isAyudanteAllowed = createRouteMatcher([
  "/tareas(.*)",
  "/menu(.*)",
  "/recetas(.*)",
  "/super(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) return NextResponse.next();

  const { userId, sessionClaims, redirectToSignIn } = await auth();

  // Sin sesión → al login.
  if (!userId) {
    return redirectToSignIn({ returnBackUrl: req.url });
  }

  // El rol viaja en el session token (configurar el claim `metadata`
  // en Clerk → Sessions → Customize session token; ver README).
  const role = roleFromMetadata(
    (sessionClaims as { metadata?: { rol?: unknown } } | null)?.metadata
  );

  // Ayudante: encerrado en Mis tareas + Menú.
  if (role === "ayudante") {
    return isAyudanteAllowed(req)
      ? NextResponse.next()
      : NextResponse.redirect(new URL("/tareas", req.url));
  }

  // Admin: sólo rol admin (familia y ayudante quedan fuera).
  if (isAdminRoute(req) && role !== "admin") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Todo menos estáticos de Next y archivos con extensión.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Siempre en API/trpc.
    "/(api|trpc)(.*)",
  ],
};
