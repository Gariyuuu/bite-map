"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "./nav-items";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((i) => i.mobile);

  return (
    <nav className="glass-panel fixed inset-x-3 bottom-3 z-40 flex items-center justify-around rounded-2xl py-2 shadow-lg md:hidden">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-0.5 rounded-xl px-3 py-1 text-[11px] font-medium",
              active ? "text-accent" : "text-muted-foreground"
            )}
          >
            <item.icon className={cn("size-5", active && "fill-accent/20")} />
            {item.label === "Photo Journal" ? "Photos" : item.label}
          </Link>
        );
      })}
    </nav>
  );
}
