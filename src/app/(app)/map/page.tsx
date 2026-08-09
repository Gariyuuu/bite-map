"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence } from "framer-motion";
import { Navigation, LocateFixed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useLocation } from "@/components/shared/location-provider";
import { useNearbyRestaurants } from "@/hooks/use-nearby-restaurants";
import { MapThemeSwitcher } from "@/components/map/theme-switcher";
import { FilterBar } from "@/components/map/filter-bar";
import { SelectedRestaurantCard } from "@/components/map/selected-restaurant-card";
import { applyFilters, type FilterId } from "@/lib/filters";
import type { MapThemeId } from "@/components/map/map-theme";
import type { RestaurantCard } from "@/types/ui";

const TAG_ONLY_CUISINES = new Set(["Date Night", "Fine Dining", "Cheap Eats", "Michelin"]);

// Leaflet touches `window` at import time, so it can never be part of the
// server-rendered bundle — load it only in the browser.
const MapCanvas = dynamic(() => import("@/components/map/map-canvas").then((m) => m.MapCanvas), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center rounded-3xl border border-border/60 bg-muted text-sm text-muted-foreground">
      Loading map...
    </div>
  ),
});

export default function MapPage() {
  const location = useLocation();
  const [theme, setTheme] = useState<MapThemeId>("standard");
  const [radiusMiles, setRadiusMiles] = useState(8);
  const [selected, setSelected] = useState<RestaurantCard | null>(null);
  const [exploreProgress, setExploreProgress] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Set<FilterId>>(new Set());
  const [activeCuisines, setActiveCuisines] = useState<Set<string>>(new Set());

  const { data, isLoading } = useNearbyRestaurants({
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    radiusMiles,
  });

  const cuisines = useMemo(() => {
    const set = new Set<string>();
    for (const r of data) {
      for (const c of r.cuisines) {
        if (!TAG_ONLY_CUISINES.has(c)) set.add(c);
      }
    }
    return Array.from(set).sort();
  }, [data]);

  const filtered = useMemo(() => applyFilters(data, activeFilters, activeCuisines), [data, activeFilters, activeCuisines]);

  function toggleFilter(id: FilterId) {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleCuisine(c: string) {
    setActiveCuisines((prev) => {
      const next = new Set(prev);
      if (next.has(c)) next.delete(c);
      else next.add(c);
      return next;
    });
  }

  const visitedCount = data.filter((r) => (r.status?.visitCount ?? 0) > 0).length;

  return (
    <div className="flex h-[calc(100vh-6rem)] flex-col gap-3 p-3 md:h-[calc(100vh-5.5rem)] md:p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <MapThemeSwitcher value={theme} onChange={setTheme} />
          <Select value={String(radiusMiles)} onValueChange={(v) => setRadiusMiles(Number(v))}>
            <SelectTrigger size="sm" className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[3, 5, 8, 15, 25].map((mi) => (
                <SelectItem key={mi} value={String(mi)}>
                  {mi} mi
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {location.status === "unset" && (
            <Button size="sm" variant="outline" onClick={location.ensureConsent}>
              <Navigation className="size-3.5" />
              Use my location
            </Button>
          )}
          {location.status !== "unset" && (
            <span className="hidden items-center gap-1 text-xs text-muted-foreground md:flex">
              <LocateFixed className="size-3.5" />
              {location.label}
            </span>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Label htmlFor="explore-progress" className="text-xs">
              Explore Progress
            </Label>
            <Switch id="explore-progress" checked={exploreProgress} onCheckedChange={setExploreProgress} />
          </div>
          <span className="text-xs text-muted-foreground">
            {visitedCount}/{data.length} explored within {radiusMiles} mi
          </span>
        </div>
      </div>

      <FilterBar
        activeFilters={activeFilters}
        onToggle={toggleFilter}
        cuisines={cuisines}
        activeCuisines={activeCuisines}
        onToggleCuisine={toggleCuisine}
      />

      <div className="relative min-h-0 flex-1">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-3xl bg-background/40 text-sm text-muted-foreground backdrop-blur-sm">
            Loading the map...
          </div>
        )}
        <MapCanvas
          restaurants={filtered}
          center={location.coords}
          theme={theme}
          selectedId={selected?.id ?? null}
          exploreProgress={exploreProgress}
          onSelect={setSelected}
        />
        <AnimatePresence>
          {selected && <SelectedRestaurantCard restaurant={selected} onClose={() => setSelected(null)} />}
        </AnimatePresence>
      </div>
    </div>
  );
}
