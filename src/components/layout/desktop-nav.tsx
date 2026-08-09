"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Utensils } from "lucide-react";
import { NAV_ITEMS } from "./nav-items";
import { AuthButtons } from "./auth-buttons";
import { PaletteSwitcher } from "./palette-switcher";
import { cn } from "@/lib/utils";

export function DesktopNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 hidden md:block">
      <div className="glass-panel mx-4 mt-4 flex items-center justify-between rounded-2xl px-4 py-2 shadow-sm">
        <Link href="/" className="flex items-center gap-2 pr-4 font-semibold tracking-tight">
          <Utensils className="size-5 text-accent" />
          <span>Bite Map</span>
        </Link>

        <nav className="flex flex-1 items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <PaletteSwitcher />
          <AuthButtons />
        </div>
      </div>
    </header>
  );
}
