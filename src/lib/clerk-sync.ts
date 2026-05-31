import "server-only";
import { clerkClient } from "@clerk/nextjs/server";
import type { Role } from "./roles";

// Refleja rol + hogar en el publicMetadata de Clerk, que es lo que lee
// el middleware para el gating de rutas.
export async function syncClerkMetadata(
  clerkId: string,
  rol: Role,
  hogarId: string | null
) {
  const cc = await clerkClient();
  await cc.users.updateUserMetadata(clerkId, {
    publicMetadata: { rol, hogar_id: hogarId },
  });
}
