// Roles de Casita. Clerk es la fuente de verdad: el rol vive en
// `publicMetadata.rol` de cada usuario de Clerk y se refleja en la
// tabla `users` de Supabase para joins/reportes.

export type Role = "admin" | "familia" | "ayudante";

export const ROLES: Role[] = ["admin", "familia", "ayudante"];

export const ROLE_LABEL: Record<Role, string> = {
  admin: "Administración",
  familia: "Familia",
  ayudante: "Ayudante",
};

// Rol por defecto para un usuario recién creado que aún no tiene
// metadata asignada en Clerk.
export const DEFAULT_ROLE: Role = "familia";

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as string[]).includes(value);
}

// Extrae el rol desde el publicMetadata de Clerk (server o client).
export function roleFromMetadata(
  metadata: { rol?: unknown } | null | undefined
): Role {
  return isRole(metadata?.rol) ? (metadata!.rol as Role) : DEFAULT_ROLE;
}
