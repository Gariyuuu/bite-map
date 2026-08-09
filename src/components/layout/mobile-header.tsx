"use client";

import Link from "next/link";
import { Utensils } from "lucide-react";
import { AuthButtons } from "./auth-buttons";
import { ThemeWheelPicker } from "./theme-wheel-picker";

/** Mobile has no top nav otherwise — this is the only place to reach theme/account on a phone. */
export function MobileHeader() {
  return (
    <header className="sticky top-0 z-40 block md:hidden">
      <div className="glass-panel mx-3 mt-3 flex items-center justify-between rounded-2xl px-3 py-2 shadow-sm">
        <Link href="/" className="flex items-center gap-1.5 font-semibold tracking-tight">
          <Utensils className="size-4 text-accent" />
          <span className="text-sm">Bite Map</span>
        </Link>
        <div className="flex items-center gap-1">
          <ThemeWheelPicker />
          <AuthButtons />
        </div>
      </div>
    </header>
  );
}
