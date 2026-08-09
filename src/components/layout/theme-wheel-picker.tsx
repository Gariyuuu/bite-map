"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PALETTES, usePalette } from "@/components/shared/palette-provider";
import { PALETTE_PREVIEWS } from "@/lib/palette-preview";
import { cn } from "@/lib/utils";

const MODES = ["light", "dark", "system"] as const;

/** Visual theme picker: a scroll-snap "wheel" of live mini-mockups using each palette's real colors. */
export function ThemeWheelPicker() {
  const { palette, setPalette } = usePalette();
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="ghost" size="icon" aria-label="Change theme" />}>
        <Palette className="size-4" />
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Appearance</DialogTitle>
        </DialogHeader>

        <div className="flex gap-1 rounded-full bg-muted p-1">
          {MODES.map((m) => (
            <button
              key={m}
              onClick={() => setTheme(m)}
              className={cn(
                "flex-1 rounded-full py-1.5 text-xs font-medium capitalize transition-colors",
                theme === m ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {m}
            </button>
          ))}
        </div>

        <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {PALETTES.map((p) => {
            const preview = PALETTE_PREVIEWS[p.id];
            const selected = p.id === palette;
            return (
              <button
                key={p.id}
                onClick={() => setPalette(p.id)}
                className={cn(
                  "flex shrink-0 snap-center flex-col items-center gap-2 transition-all",
                  selected ? "scale-105" : "opacity-60 hover:opacity-100"
                )}
              >
                <div
                  className="relative h-24 w-20 overflow-hidden rounded-xl border-2 shadow-md"
                  style={{ background: preview.background, borderColor: selected ? preview.accent : "transparent" }}
                >
                  <div className="flex h-5 w-full items-center gap-1 px-1.5" style={{ background: preview.card }}>
                    <span className="size-1.5 rounded-full" style={{ background: preview.accent }} />
                    <span className="h-1 flex-1 rounded-full" style={{ background: preview.foreground, opacity: 0.2 }} />
                  </div>
                  <div className="space-y-1.5 p-2">
                    <span className="block h-1.5 w-3/4 rounded-full" style={{ background: preview.foreground, opacity: 0.15 }} />
                    <span className="block h-1.5 w-1/2 rounded-full" style={{ background: preview.foreground, opacity: 0.15 }} />
                    <span className="mt-2 block h-5 w-10 rounded-full" style={{ background: preview.accent }} />
                  </div>
                </div>
                <span className={cn("text-xs", selected ? "font-semibold" : "font-medium text-muted-foreground")}>{p.label}</span>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
