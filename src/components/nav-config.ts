import type { Role } from "@/lib/roles";
import {
  Home,
  UtensilsCrossed,
  BookOpen,
  ShoppingCart,
  CheckSquare,
  Shield,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  roles: Role[];
}

// Navegación de la app. `roles` define quién ve cada sección.
// - admin: todo
// - familia: todo menos Admin
// - ayudante: lo operativo (menú a cocinar, súper, tareas)
export const NAV_ITEMS: NavItem[] = [
  {
    href: "/dashboard",
    label: "Inicio",
    icon: Home,
    roles: ["admin", "familia", "ayudante"],
  },
  {
    href: "/menu",
    label: "Menú",
    icon: UtensilsCrossed,
    roles: ["admin", "familia", "ayudante"],
  },
  {
    href: "/recetas",
    label: "Recetas",
    icon: BookOpen,
    roles: ["admin", "familia"],
  },
  {
    href: "/super",
    label: "Súper",
    icon: ShoppingCart,
    roles: ["admin", "familia", "ayudante"],
  },
  {
    href: "/tareas",
    label: "Tareas",
    icon: CheckSquare,
    roles: ["admin", "familia", "ayudante"],
  },
  {
    href: "/admin",
    label: "Admin",
    icon: Shield,
    roles: ["admin"],
  },
];

export function navItemsForRole(role: Role): NavItem[] {
  return NAV_ITEMS.filter((item) => item.roles.includes(role));
}

// Mapa href → roles permitidos, para chequeos de acceso (middleware/server).
export const ROUTE_ACCESS: Record<string, Role[]> = Object.fromEntries(
  NAV_ITEMS.map((item) => [item.href, item.roles])
);
