export const MAP_THEMES = ["standard", "dark", "satellite", "minimal", "friday"] as const;
export type MapThemeId = (typeof MAP_THEMES)[number];

export const MAP_THEME_META: Record<MapThemeId, { label: string; className: string; gridOpacity: number }> = {
  standard: { label: "Standard", className: "bg-[#eef1f4]", gridOpacity: 0.06 },
  dark: { label: "Dark", className: "bg-[#0c0f14]", gridOpacity: 0.1 },
  satellite: {
    label: "Satellite",
    className: "bg-[radial-gradient(circle_at_30%_20%,#2b3a2e,transparent_60%),radial-gradient(circle_at_70%_70%,#1f2b1f,transparent_60%),#14201a]",
    gridOpacity: 0,
  },
  minimal: { label: "Minimal", className: "bg-white dark:bg-neutral-950", gridOpacity: 0.03 },
  friday: {
    label: "FRIDAY",
    className: "bg-[radial-gradient(circle_at_50%_0%,#0c1c2b,#050810_70%)]",
    gridOpacity: 0.18,
  },
};

/** Mapbox style URL used only when NEXT_PUBLIC_MAPBOX_TOKEN is configured (real-tile upgrade path). */
export const MAPBOX_STYLE_URLS: Record<MapThemeId, string> = {
  standard: "mapbox://styles/mapbox/streets-v12",
  dark: "mapbox://styles/mapbox/dark-v11",
  satellite: "mapbox://styles/mapbox/satellite-streets-v12",
  minimal: "mapbox://styles/mapbox/light-v11",
  friday: "mapbox://styles/mapbox/dark-v11",
};
