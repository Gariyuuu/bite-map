"use client";

import { useMemo, useState } from "react";
import { Navigation } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLocation } from "@/components/shared/location-provider";
import { useNearbyRestaurants } from "@/hooks/use-nearby-restaurants";
import { FilterBar } from "@/components/map/filter-bar";
import { SectionRow } from "@/components/restaurants/section-row";
import { RestaurantCard } from "@/components/restaurants/restaurant-card";
import { RestaurantCardSkeletonGrid } from "@/components/restaurants/restaurant-card-skeleton";
import { applyFilters, type FilterId } from "@/lib/filters";

const TAG_ONLY_CUISINES = new Set(["Date Night", "Fine Dining", "Cheap Eats", "Michelin"]);

export default function DiscoverPage() {
  const location = useLocation();
  const [search, setSearch] = useState("");
  const [activeFilters, setActiveFilters] = useState<Set<FilterId>>(new Set());
  const [activeCuisines, setActiveCuisines] = useState<Set<string>>(new Set());

  const { data, isLoading } = useNearbyRestaurants({
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    radiusMiles: 15,
    query: search || undefined,
  });

  const cuisines = useMemo(() => {
    const set = new Set<string>();
    for (const r of data) for (const c of r.cuisines) if (!TAG_ONLY_CUISINES.has(c)) set.add(c);
    return Array.from(set).sort();
  }, [data]);

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

  const filtered = useMemo(() => applyFilters(data, activeFilters, activeCuisines), [data, activeFilters, activeCuisines]);
  const hasActiveFilters = activeFilters.size > 0 || activeCuisines.size > 0;

  const trending = useMemo(
    () => [...data].sort((a, b) => (b.trendingScore ?? 0) - (a.trendingScore ?? 0)).slice(0, 8),
    [data]
  );
  const havenTried = useMemo(() => data.filter((r) => (r.status?.visitCount ?? 0) === 0).slice(0, 8), [data]);
  const highlyRated = useMemo(
    () => [...data].filter((r) => (r.consensusScore ?? 0) > 0).sort((a, b) => (b.consensusScore ?? 0) - (a.consensusScore ?? 0)).slice(0, 8),
    [data]
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Discover</h1>
        <p className="text-sm text-muted-foreground">
          Restaurants near {location.label}
          {location.status === "unset" && (
            <Button variant="link" size="sm" className="h-auto p-0 pl-1 text-xs" onClick={location.ensureConsent}>
              <Navigation className="size-3" /> use my location
            </Button>
          )}
        </p>
      </div>

      <Input
        placeholder="Search restaurants, cuisines, neighborhoods..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-md"
      />

      <FilterBar
        activeFilters={activeFilters}
        onToggle={toggleFilter}
        cuisines={cuisines}
        activeCuisines={activeCuisines}
        onToggleCuisine={toggleCuisine}
      />

      {isLoading ? (
        <div className="space-y-2">
          <div className="h-4 w-40 animate-pulse rounded bg-muted" />
          <RestaurantCardSkeletonGrid />
        </div>
      ) : (
        <>
          {!hasActiveFilters && !search && (
            <div className="space-y-6">
              <SectionRow title="🔥 Trending Near You" restaurants={trending} />
              <SectionRow title="You Haven't Tried This" restaurants={havenTried} />
              <SectionRow title="Highly Rated" restaurants={highlyRated} />
            </div>
          )}

          <section className="space-y-2">
            <h2 className="px-1 text-sm font-semibold text-muted-foreground">
              {hasActiveFilters || search ? "Results" : "All Nearby"}
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((r) => (
                <RestaurantCard key={r.id} restaurant={r} />
              ))}
            </div>
            {filtered.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">No restaurants match these filters yet.</p>
            )}
          </section>
        </>
      )}
    </div>
  );
}
