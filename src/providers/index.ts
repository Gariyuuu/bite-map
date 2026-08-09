import type { NormalizedRestaurant } from "@/types/restaurant";
import type { NearbySearchParams, RestaurantProvider } from "./types";
import { googleProvider } from "./google";
import { yelpProvider } from "./yelp";
import { foursquareProvider } from "./foursquare";
import { osmProvider } from "./osm";
import { mockProvider } from "./mock";

export const allProviders: RestaurantProvider[] = [
  googleProvider,
  yelpProvider,
  foursquareProvider,
  osmProvider,
  mockProvider,
];

export function configuredProviders(): RestaurantProvider[] {
  return allProviders.filter((p) => p.isConfigured());
}

/**
 * Fans out a nearby search to every configured real provider. Falls back to
 * the mock provider whenever no real API keys are set, so the app is fully
 * functional out of the box (section 56). Results are NOT deduped here —
 * see /lib/entity-resolution.ts, which merges raw provider results into
 * canonical restaurants before they're persisted or shown.
 */
export async function searchAllProviders(params: NearbySearchParams): Promise<NormalizedRestaurant[]> {
  const real = [googleProvider, yelpProvider, foursquareProvider, osmProvider].filter((p) =>
    p.isConfigured()
  );
  const active = real.length > 0 ? real : [mockProvider];

  const results = await Promise.allSettled(active.map((p) => p.searchNearby(params)));
  return results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
}

export * from "./types";
