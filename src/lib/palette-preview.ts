import type { PaletteId } from "@/components/shared/palette-provider";

export interface PalettePreview {
  accent: string;
  background: string;
  foreground: string;
  card: string;
}

/**
 * Mirrors the real `[data-palette]` custom properties in globals.css so the
 * theme picker's preview cards render the actual colors a palette applies,
 * not an approximation. Keep in sync if globals.css palette values change.
 */
export const PALETTE_PREVIEWS: Record<PaletteId, PalettePreview> = {
  midnight: { accent: "oklch(0.62 0.19 264)", background: "oklch(0.16 0.02 264)", foreground: "oklch(0.95 0 0)", card: "oklch(0.205 0.02 264)" },
  cream: { accent: "oklch(0.68 0.14 55)", background: "oklch(0.98 0.01 85)", foreground: "oklch(0.28 0.02 55)", card: "oklch(1 0 0)" },
  matcha: { accent: "oklch(0.55 0.1 145)", background: "oklch(0.97 0.015 145)", foreground: "oklch(0.27 0.03 145)", card: "oklch(1 0 0)" },
  sakura: { accent: "oklch(0.72 0.12 10)", background: "oklch(0.98 0.012 15)", foreground: "oklch(0.32 0.03 15)", card: "oklch(1 0 0)" },
  espresso: { accent: "oklch(0.62 0.1 45)", background: "oklch(0.2 0.02 45)", foreground: "oklch(0.93 0.01 60)", card: "oklch(0.26 0.025 45)" },
  friday: { accent: "oklch(0.75 0.16 195)", background: "oklch(0.12 0.02 240)", foreground: "oklch(0.95 0.005 220)", card: "oklch(0.17 0.02 235)" },
  "tokyo-night": { accent: "oklch(0.68 0.19 320)", background: "oklch(0.17 0.025 280)", foreground: "oklch(0.93 0.01 280)", card: "oklch(0.23 0.03 280)" },
  minimal: { accent: "oklch(0.3 0 0)", background: "oklch(1 0 0)", foreground: "oklch(0.16 0 0)", card: "oklch(0.99 0 0)" },
};
