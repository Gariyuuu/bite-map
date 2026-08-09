"use client";

import { Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { PALETTES, usePalette } from "@/components/shared/palette-provider";
import { useTheme } from "next-themes";

export function PaletteSwitcher() {
  const { palette, setPalette } = usePalette();
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" aria-label="Change theme" />}>
        <Palette className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Appearance</DropdownMenuLabel>
        {(["light", "dark", "system"] as const).map((t) => (
          <DropdownMenuItem key={t} onSelect={() => setTheme(t)} className="capitalize">
            {t === theme ? "✓ " : ""}
            {t}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Palette</DropdownMenuLabel>
        {PALETTES.map((p) => (
          <DropdownMenuItem key={p.id} onSelect={() => setPalette(p.id)}>
            {p.id === palette ? "✓ " : ""}
            {p.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
