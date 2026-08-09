"use client";

import { useEffect, useState, useCallback } from "react";
import type { RestaurantCard } from "@/types/ui";

interface Params {
  latitude: number;
  longitude: number;
  radiusMiles: number;
  query?: string;
  cuisines?: string[];
}

export function useNearbyRestaurants(params: Params) {
  const [data, setData] = useState<RestaurantCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const refetch = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    // Resetting loading/error at the start of each fetch is standard for this pattern.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(true);
    setError(null);

    const search = new URLSearchParams({
      lat: String(params.latitude),
      lng: String(params.longitude),
      radius: String(params.radiusMiles),
    });
    if (params.query) search.set("q", params.query);
    if (params.cuisines?.length) search.set("cuisines", params.cuisines.join(","));

    fetch(`/api/restaurants/nearby?${search}`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load restaurants");
        return res.json();
      })
      .then((json) => setData(json.restaurants))
      .catch((err) => {
        if (err.name !== "AbortError") setError(err.message);
      })
      .finally(() => setIsLoading(false));

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.latitude, params.longitude, params.radiusMiles, params.query, params.cuisines?.join(","), nonce]);

  return { data, isLoading, error, refetch };
}
