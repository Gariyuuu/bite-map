"use client";

import { useMemo, useEffect } from "react";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import { getMarkerStatus, MARKER_STATUS_META } from "@/lib/restaurant-status";
import { MAP_TILE_CONFIG, type MapThemeId } from "./map-theme";
import { cn } from "@/lib/utils";
import type { RestaurantCard } from "@/types/ui";

interface Props {
  restaurants: RestaurantCard[];
  center: { latitude: number; longitude: number };
  theme: MapThemeId;
  selectedId: string | null;
  exploreProgress: boolean;
  onSelect: (restaurant: RestaurantCard) => void;
}

function RecenterMap({ center }: { center: { latitude: number; longitude: number } }) {
  const map = useMap();
  useEffect(() => {
    map.setView([center.latitude, center.longitude], map.getZoom(), { animate: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center.latitude, center.longitude]);
  return null;
}

function buildMarkerIcon(glyph: string, hex: string, selected: boolean, glow: number) {
  const glowShadow = glow > 0 ? `, 0 0 ${6 + glow * 14}px rgba(56,189,248,${0.25 + glow * 0.45})` : "";
  return L.divIcon({
    html: `<div style="
      width:26px;height:26px;border-radius:9999px;background:white;
      border:2px solid ${selected ? "#0ea5e9" : "rgba(0,0,0,0.08)"};
      display:flex;align-items:center;justify-content:center;
      font-size:13px;line-height:1;color:${hex};
      box-shadow:0 1px 3px rgba(0,0,0,0.35)${glowShadow};
    ">${glyph}</div>`,
    className: "bitemap-marker",
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });
}

const USER_ICON = L.divIcon({
  html: `<span class="relative flex size-3">
    <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-60"></span>
    <span class="relative inline-flex size-3 rounded-full bg-sky-500 ring-2 ring-white"></span>
  </span>`,
  className: "bitemap-user-marker",
  iconSize: [12, 12],
  iconAnchor: [6, 6],
});

/**
 * Real interactive map (Leaflet + free OSM/CartoDB/Esri tiles — no API key
 * required). Themes swap the tile source; FRIDAY reuses the dark tiles with
 * a CSS overlay in the wrapper below rather than replacing real streets
 * with an abstract illustration.
 */
export function MapCanvas({ restaurants, center, theme, selectedId, exploreProgress, onSelect }: Props) {
  const tiles = MAP_TILE_CONFIG[theme];

  const neighborhoodProgress = useMemo(() => {
    const groups = new Map<string, { total: number; visited: number }>();
    for (const r of restaurants) {
      const key = r.neighborhood ?? r.city ?? "Nearby";
      const entry = groups.get(key) ?? { total: 0, visited: 0 };
      entry.total += 1;
      if ((r.status?.visitCount ?? 0) > 0) entry.visited += 1;
      groups.set(key, entry);
    }
    return groups;
  }, [restaurants]);

  return (
    <div
      className={cn(
        "relative h-full w-full overflow-hidden rounded-3xl border border-border/60",
        theme === "friday" && "bitemap-friday-overlay"
      )}
    >
      <MapContainer
        center={[center.latitude, center.longitude]}
        zoom={13}
        scrollWheelZoom
        className="h-full w-full"
        style={{ background: theme === "dark" || theme === "friday" ? "#0c0f14" : undefined }}
      >
        <RecenterMap center={center} />
        <TileLayer
          key={theme}
          url={tiles.url}
          attribution={tiles.attribution}
          subdomains={tiles.subdomains ?? "abc"}
          maxZoom={tiles.maxZoom ?? 19}
        />

        <Marker position={[center.latitude, center.longitude]} icon={USER_ICON} />

        {restaurants.map((restaurant) => {
          const statusId = getMarkerStatus(restaurant);
          const meta = MARKER_STATUS_META[statusId];
          const key = restaurant.neighborhood ?? restaurant.city ?? "Nearby";
          const progress = neighborhoodProgress.get(key);
          const glow = exploreProgress && progress && progress.total > 0 ? progress.visited / progress.total : 0;

          return (
            <Marker
              key={restaurant.id}
              position={[restaurant.latitude, restaurant.longitude]}
              icon={buildMarkerIcon(meta.glyph, meta.hex, restaurant.id === selectedId, glow)}
              eventHandlers={{ click: () => onSelect(restaurant) }}
            >
              <Tooltip direction="top" offset={[0, -14]} opacity={1}>
                {restaurant.name}
              </Tooltip>
            </Marker>
          );
        })}
      </MapContainer>

      {restaurants.length === 0 && (
        <div className="pointer-events-none absolute inset-0 z-[500] flex items-center justify-center text-sm text-muted-foreground">
          No restaurants in this area yet.
        </div>
      )}
    </div>
  );
}
