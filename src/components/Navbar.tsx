"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { ROLE_LABEL, type Role } from "@/lib/roles";
import { navItemsForRole } from "./nav-config";

export function Navbar({ role }: { role: Role }) {
  const pathname = usePathname();
  const items = navItemsForRole(role);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      {/* Header superior */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-tinta/5 bg-crema/80 px-5 py-3 backdrop-blur-md">
        <Link href="/dashboard" className="flex items-baseline gap-2">
          <span className="font-serif text-2xl font-semibold text-terracota">
            Casita
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-tinta/50 sm:inline">
            {ROLE_LABEL[role]}
          </span>
          <UserButton
            appearance={{ elements: { avatarBox: "h-8 w-8" } }}
          />
        </div>
      </header>

      {/* Nav lateral en desktop */}
      <nav className="fixed left-0 top-[57px] bottom-0 z-20 hidden w-56 flex-col gap-1 border-r border-tinta/5 px-3 py-6 md:flex">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm transition-colors ${
                active
                  ? "bg-terracota/10 font-medium text-terracota-ink"
                  : "text-tinta/70 hover:bg-blanco"
              }`}
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Tab bar inferior en mobile */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex items-stretch justify-around border-t border-tinta/5 bg-blanco/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] transition-colors ${
                active ? "text-terracota" : "text-tinta/50"
              }`}
            >
              <Icon className="h-5 w-5" strokeWidth={active ? 2 : 1.6} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
