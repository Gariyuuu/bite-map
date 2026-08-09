import type { NormalizedRestaurant } from "@/types/restaurant";
import type { NearbySearchParams, RestaurantProvider } from "./types";
import { mockRestaurants, photoUrl } from "@/db/seed/data";
import { haversineMiles } from "@/lib/geo";

function toNormalized(seed: (typeof mockRestaurants)[number]): NormalizedRestaurant {
  const primary = seed.sources[0];
  return {
    provider: "mock",
    externalId: seed.id,
    name: seed.name,
    latitude: seed.latitude,
    longitude: seed.longitude,
    address: seed.address,
    city: seed.city,
    neighborhood: seed.neighborhood,
    zip: seed.zip,
    cuisines: seed.cuisines,
    priceLevel: seed.priceLevel,
    rating: primary?.rating,
    ratingScale: primary?.ratingScale ?? 5,
    ratingCount: primary?.ratingCount,
    photos: seed.photoSeeds.map(photoUrl),
    website: seed.website,
    phone: seed.phone,
    openingHours: seed.openingHours,
    signatureDishes: seed.dishes,
  };
}

/**
 * Always-available fallback provider so the app is fully usable with zero API
 * keys configured (section 56). Backed by the hand-authored OC/LA dataset in
 * /db/seed/data.ts, which is also used to seed the database for local dev.
 */
export const mockProvider: RestaurantProvider = {
  id: "mock",
  isConfigured() {
    return true;
  },
  async searchNearby({ latitude, longitude, radiusMeters, query, cuisines, limit }: NearbySearchParams) {
    const radiusMiles = radiusMeters / 1609.34;
    let results = mockRestaurants.filter(
      (r) => haversineMiles(latitude, longitude, r.latitude, r.longitude) <= radiusMiles
    );

    if (query) {
      const q = query.toLowerCase();
      results = results.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.cuisines.some((c) => c.toLowerCase().includes(q)) ||
          r.neighborhood.toLowerCase().includes(q)
      );
    }

    if (cuisines?.length) {
      results = results.filter((r) => r.cuisines.some((c) => cuisines.includes(c)));
    }

    return results.slice(0, limit ?? 100).map(toNormalized);
  },
  async getById(externalId: string) {
    const found = mockRestaurants.find((r) => r.id === externalId);
    return found ? toNormalized(found) : null;
  },
};
