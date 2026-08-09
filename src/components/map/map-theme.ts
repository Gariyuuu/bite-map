export const MAP_THEMES = ["standard", "dark", "satellite", "minimal", "friday"] as const;
export type MapThemeId = (typeof MAP_THEMES)[number];

export interface TileConfig {
  label: string;
  url: string;
  attribution: string;
  subdomains?: string;
  /** Esri XYZ tiles use {y}/{x} order instead of the usual {x}/{y}. */
  maxZoom?: number;
}

/**
 * Real, no-API-key-required tile sources. Standard/Minimal/Satellite use
 * OpenStreetMap/CartoDB/Esri's free public tile servers directly — this is
 * an actual navigable map, not an abstract illustration. FRIDAY reuses the
 * Dark tiles with a CSS overlay (see map-canvas.tsx) so the futuristic
 * styling sits on top of real streets instead of replacing them.
 */
export const MAP_TILE_CONFIG: Record<MapThemeId, TileConfig> = {
  standard: {
    label: "Standard",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    subdomains: "abc",
    maxZoom: 19,
  },
  dark: {
    label: "Dark",
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: "abcd",
    maxZoom: 20,
  },
  satellite: {
    label: "Satellite",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri",
    maxZoom: 19,
  },
  minimal: {
    label: "Minimal",
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: "abcd",
    maxZoom: 20,
  },
  friday: {
    label: "FRIDAY",
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: "abcd",
    maxZoom: 20,
  },
};

export const MAP_THEME_META = Object.fromEntries(
  MAP_THEMES.map((id) => [id, { label: MAP_TILE_CONFIG[id].label }])
) as Record<MapThemeId, { label: string }>;
