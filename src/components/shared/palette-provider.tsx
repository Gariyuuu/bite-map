"use client";

import { createContext, useContext, useEffect, useState } from "react";

export const PALETTES = [
  { id: "midnight", label: "Midnight" },
  { id: "cream", label: "Cream" },
  { id: "matcha", label: "Matcha" },
  { id: "sakura", label: "Sakura" },
  { id: "espresso", label: "Espresso" },
  { id: "friday", label: "FRIDAY" },
  { id: "tokyo-night", label: "Tokyo Night" },
  { id: "minimal", label: "Minimal White" },
] as const;

export type PaletteId = (typeof PALETTES)[number]["id"];

const PaletteContext = createContext<{ palette: PaletteId; setPalette: (p: PaletteId) => void }>({
  palette: "midnight",
  setPalette: () => {},
});

export function PaletteProvider({ children }: { children: React.ReactNode }) {
  const [palette, setPaletteState] = useState<PaletteId>("midnight");

  useEffect(() => {
    const stored = window.localStorage.getItem("bitemap-palette") as PaletteId | null;
    if (stored && PALETTES.some((p) => p.id === stored)) {
      // Reading localStorage only after mount avoids an SSR/client hydration mismatch.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPaletteState(stored);
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-palette", palette);
  }, [palette]);

  function setPalette(p: PaletteId) {
    setPaletteState(p);
    window.localStorage.setItem("bitemap-palette", p);
  }

  return <PaletteContext.Provider value={{ palette, setPalette }}>{children}</PaletteContext.Provider>;
}

export function usePalette() {
  return useContext(PaletteContext);
}
