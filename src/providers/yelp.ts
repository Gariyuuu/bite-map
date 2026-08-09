import type { NormalizedRestaurant, PriceLevel } from "@/types/restaurant";
import type { NearbySearchParams, RestaurantProvider } from "./types";

interface YelpBusiness {
  id: string;
  name: string;
  coordinates: { latitude: number; longitude: number };
  location: {
    address1?: string;
    city?: string;
    zip_code?: string;
    neighborhoods?: string[];
  };
  categories: { alias: string; title: string }[];
  price?: string; // "$" - "$$$$"
  rating: number;
  review_count: number;
  image_url?: string;
  photos?: string[];
  url?: string;
  display_phone?: string;
}

function toNormalized(b: YelpBusiness): NormalizedRestaurant {
  return {
    provider: "yelp",
    externalId: b.id,
    name: b.name,
    latitude: b.coordinates.latitude,
    longitude: b.coordinates.longitude,
    address: b.location.address1,
    city: b.location.city,
    neighborhood: b.location.neighborhoods?.[0],
    zip: b.location.zip_code,
    cuisines: b.categories.map((c) => c.title),
    priceLevel: b.price as PriceLevel | undefined,
    rating: b.rating,
    ratingScale: 5,
    ratingCount: b.review_count,
    photos: b.photos?.length ? b.photos : b.image_url ? [b.image_url] : undefined,
    website: b.url,
    phone: b.display_phone,
    yelpId: b.id,
    sourceUrl: b.url,
  };
}

export const yelpProvider: RestaurantProvider = {
  id: "yelp",
  isConfigured() {
    return Boolean(process.env.YELP_API_KEY);
  },
  async searchNearby({ latitude, longitude, radiusMeters, query, cuisines, limit }: NearbySearchParams) {
    const apiKey = process.env.YELP_API_KEY;
    if (!apiKey) return [];

    const params = new URLSearchParams({
      latitude: String(latitude),
      longitude: String(longitude),
      radius: String(Math.min(radiusMeters, 40000)),
      categories: "restaurants",
      limit: String(Math.min(limit ?? 20, 50)),
    });
    if (query) params.set("term", query);
    if (cuisines?.length) params.set("categories", cuisines.join(",") + ",restaurants");

    const res = await fetch(`https://api.yelp.com/v3/businesses/search?${params}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { businesses?: YelpBusiness[] };
    return (data.businesses ?? []).map(toNormalized);
  },
  async getById(externalId: string) {
    const apiKey = process.env.YELP_API_KEY;
    if (!apiKey) return null;
    const res = await fetch(`https://api.yelp.com/v3/businesses/${externalId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return toNormalized((await res.json()) as YelpBusiness);
  },
};
