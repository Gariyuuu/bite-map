"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { computeBounds, project } from "@/lib/map-projection";
import { getMarkerStatus, MARKER_STATUS_META } from "@/lib/restaurant-status";
import { MAP_THEME_META, type MapThemeId } from "./map-theme";
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

/**
 * Custom lat/lng → percentage projection map. Renders with zero external
 * tile dependency so the map works with no Mapbox/Google key configured
 * (spec section 56). When NEXT_PUBLIC_MAPBOX_TOKEN is set, this can be
 * swapped for a real react-map-gl <Map> using the same restaurant list and
 * MAPBOX_STYLE_URLS — see components/map/mapbox-canvas.tsx.
 */
export function MapCanvas({ restaurants, center, theme, selectedId, exploreProgress, onSelect }: Props) {
  const bounds = useMemo(() => computeBounds(restaurants, center), [restaurants, center]);
  const themeMeta = MAP_THEME_META[theme];
  const centerPos = project(center.latitude, center.longitude, bounds);

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
        themeMeta.className
      )}
    >
      {/* grid overlay */}
      <svg className="absolute inset-0 h-full w-full" style={{ opacity: themeMeta.gridOpacity }}>
        <defs>
          <pattern id="bitemap-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M40 0H0V40" fill="none" stroke="currentColor" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#bitemap-grid)" className={theme === "friday" ? "text-cyan-300" : "text-foreground"} />
      </svg>

      {theme === "friday" && (
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.08),transparent_55%)]" />
      )}

      {/* user position */}
      <div
        className="absolute -translate-x-1/2 -translate-y-1/2"
        style={{ left: `${centerPos.xPct}%`, top: `${centerPos.yPct}%` }}
      >
        <span className="relative flex size-3">
          <span
            className={cn(
              "absolute inline-flex h-full w-full animate-ping rounded-full opacity-60",
              theme === "friday" ? "bg-cyan-400" : "bg-blue-500"
            )}
          />
          <span className={cn("relative inline-flex size-3 rounded-full", theme === "friday" ? "bg-cyan-400" : "bg-blue-500")} />
        </span>
      </div>

      {/* markers */}
      <AnimatePresence>
        {restaurants.map((restaurant) => {
          const { xPct, yPct } = project(restaurant.latitude, restaurant.longitude, bounds);
          const statusId = getMarkerStatus(restaurant);
          const meta = MARKER_STATUS_META[statusId];
          const Icon = meta.icon;
          const selected = restaurant.id === selectedId;

          const key = restaurant.neighborhood ?? restaurant.city ?? "Nearby";
          const progress = neighborhoodProgress.get(key);
          const pct = progress && progress.total > 0 ? progress.visited / progress.total : 0;

          return (
            <motion.button
              key={restaurant.id}
              type="button"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              whileHover={{ scale: 1.25, zIndex: 30 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              onClick={() => onSelect(restaurant)}
              className={cn(
                "group absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 bg-background/90 p-1.5 shadow-md backdrop-blur",
                selected ? "border-accent ring-4 ring-accent/30 z-20" : "border-transparent"
              )}
              style={{
                left: `${xPct}%`,
                top: `${yPct}%`,
                boxShadow: exploreProgress ? `0 0 ${8 + pct * 16}px rgba(56,189,248,${0.15 + pct * 0.35})` : undefined,
              }}
              title={restaurant.name}
            >
              <Icon className={cn("size-3.5", meta.className)} />
              <span className="pointer-events-none absolute left-1/2 top-full z-30 mt-1 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-popover px-2 py-1 text-xs text-popover-foreground shadow-md group-hover:block">
                {restaurant.name}
              </span>
            </motion.button>
          );
        })}
      </AnimatePresence>

      {restaurants.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
          No restaurants in this area yet.
        </div>
      )}
    </div>
  );
}
