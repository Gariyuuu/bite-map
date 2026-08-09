import type { NormalizedRestaurant, ProviderId } from "@/types/restaurant";

export interface NearbySearchParams {
  latitude: number;
  longitude: number;
  radiusMeters: number;
  query?: string;
  cuisines?: string[];
  limit?: number;
}

/**
 * Every restaurant data source (Google, Yelp, Foursquare, OSM, mock) implements
 * this interface. The rest of the app only ever talks to `RestaurantProvider`,
 * never to a specific vendor SDK — see /providers/index.ts for the orchestrator
 * that fans out to whichever providers are configured and merges the results.
 */
export interface RestaurantProvider {
  readonly id: ProviderId;
  /** True when required env vars are present. Unconfigured providers are skipped, never thrown. */
  isConfigured(): boolean;
  searchNearby(params: NearbySearchParams): Promise<NormalizedRestaurant[]>;
  getById(externalId: string): Promise<NormalizedRestaurant | null>;
}
