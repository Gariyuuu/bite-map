"use client";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { MAP_THEMES, MAP_THEME_META, type MapThemeId } from "./map-theme";

export function MapThemeSwitcher({ value, onChange }: { value: MapThemeId; onChange: (t: MapThemeId) => void }) {
  return (
    <ToggleGroup
      value={[value]}
      onValueChange={(v) => v[0] && onChange(v[0] as MapThemeId)}
      className="glass-panel rounded-full p-1"
    >
      {MAP_THEMES.map((t) => (
        <ToggleGroupItem key={t} value={t} className="rounded-full px-3 text-xs data-[pressed]:bg-accent data-[pressed]:text-accent-foreground">
          {MAP_THEME_META[t].label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
