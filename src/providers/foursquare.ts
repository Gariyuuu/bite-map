import type { NormalizedRestaurant } from "@/types/restaurant";
import type { NearbySearchParams, RestaurantProvider } from "./types";

interface FoursquarePlace {
  fsq_place_id: string;
  name: string;
  latitude: number;
  longitude: number;
  location?: { address?: string; locality?: string; neighborhood?: string[]; postcode?: string };
  categories?: { name: string }[];
  rating?: number; // 0-10 scale
  stats?: { total_ratings?: number };
  website?: string;
  tel?: string;
  photos?: { prefix: string; suffix: string }[];
}

function toNormalized(p: FoursquarePlace): NormalizedRestaurant {
  return {
    provider: "foursquare",
    externalId: p.fsq_place_id,
    name: p.name,
    latitude: p.latitude,
    longitude: p.longitude,
    address: p.location?.address,
    city: p.location?.locality,
    neighborhood: p.location?.neighborhood?.[0],
    zip: p.location?.postcode,
    cuisines: p.categories?.map((c) => c.name) ?? [],
    rating: p.rating,
    ratingScale: 10,
    ratingCount: p.stats?.total_ratings,
    photos: p.photos?.map((ph) => `${ph.prefix}800x600${ph.suffix}`),
    website: p.website,
    phone: p.tel,
    foursquareId: p.fsq_place_id,
  };
}

export const foursquareProvider: RestaurantProvider = {
  id: "foursquare",
  isConfigured() {
    return Boolean(process.env.FOURSQUARE_API_KEY);
  },
  async searchNearby({ latitude, longitude, radiusMeters, query, limit }: NearbySearchParams) {
    const apiKey = process.env.FOURSQUARE_API_KEY;
    if (!apiKey) return [];

    const params = new URLSearchParams({
      ll: `${latitude},${longitude}`,
      radius: String(Math.min(radiusMeters, 100000)),
      categories: "13065", // Food > Restaurant
      limit: String(Math.min(limit ?? 20, 50)),
    });
    if (query) params.set("query", query);

    const res = await fetch(`https://places-api.foursquare.com/places/search?${params}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "X-Places-Api-Version": "2025-06-17",
      },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { results?: FoursquarePlace[] };
    return (data.results ?? []).map(toNormalized);
  },
  async getById(externalId: string) {
    const apiKey = process.env.FOURSQUARE_API_KEY;
    if (!apiKey) return null;
    const res = await fetch(`https://places-api.foursquare.com/places/${externalId}`, {
      headers: { Authorization: `Bearer ${apiKey}`, "X-Places-Api-Version": "2025-06-17" },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return toNormalized((await res.json()) as FoursquarePlace);
  },
};
