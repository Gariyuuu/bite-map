import type { NormalizedRestaurant, PriceLevel } from "@/types/restaurant";
import type { NearbySearchParams, RestaurantProvider } from "./types";

const GOOGLE_PRICE_LEVELS: Record<string, PriceLevel> = {
  PRICE_LEVEL_INEXPENSIVE: "$",
  PRICE_LEVEL_MODERATE: "$$",
  PRICE_LEVEL_EXPENSIVE: "$$$",
  PRICE_LEVEL_VERY_EXPENSIVE: "$$$$",
};

const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.location",
  "places.formattedAddress",
  "places.addressComponents",
  "places.types",
  "places.priceLevel",
  "places.rating",
  "places.userRatingCount",
  "places.photos",
  "places.websiteUri",
  "places.internationalPhoneNumber",
  "places.regularOpeningHours",
].join(",");

interface GooglePlace {
  id: string;
  displayName?: { text: string };
  location?: { latitude: number; longitude: number };
  formattedAddress?: string;
  addressComponents?: { longText: string; types: string[] }[];
  types?: string[];
  priceLevel?: string;
  rating?: number;
  userRatingCount?: number;
  photos?: { name: string }[];
  websiteUri?: string;
  internationalPhoneNumber?: string;
  regularOpeningHours?: { weekdayDescriptions?: string[] };
}

function component(place: GooglePlace, type: string) {
  return place.addressComponents?.find((c) => c.types.includes(type))?.longText;
}

function toNormalized(place: GooglePlace, apiKey: string): NormalizedRestaurant {
  return {
    provider: "google",
    externalId: place.id,
    name: place.displayName?.text ?? "Unknown",
    latitude: place.location?.latitude ?? 0,
    longitude: place.location?.longitude ?? 0,
    address: place.formattedAddress,
    city: component(place, "locality"),
    neighborhood: component(place, "neighborhood") ?? component(place, "sublocality"),
    zip: component(place, "postal_code"),
    cuisines: (place.types ?? [])
      .filter((t) => t.endsWith("_restaurant") || ["restaurant", "cafe", "bakery"].includes(t))
      .map((t) => t.replace(/_restaurant$/, "").replace(/_/g, " ")),
    priceLevel: place.priceLevel ? GOOGLE_PRICE_LEVELS[place.priceLevel] : undefined,
    rating: place.rating,
    ratingScale: 5,
    ratingCount: place.userRatingCount,
    photos: place.photos?.map(
      (p) => `https://places.googleapis.com/v1/${p.name}/media?maxWidthPx=800&key=${apiKey}`
    ),
    website: place.websiteUri,
    phone: place.internationalPhoneNumber,
    googlePlaceId: place.id,
  };
}

export const googleProvider: RestaurantProvider = {
  id: "google",
  isConfigured() {
    return Boolean(process.env.GOOGLE_PLACES_API_KEY);
  },
  async searchNearby({ latitude, longitude, radiusMeters, cuisines, limit }: NearbySearchParams) {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) return [];

    const res = await fetch("https://places.googleapis.com/v1/places:searchNearby", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": FIELD_MASK,
      },
      body: JSON.stringify({
        includedTypes: ["restaurant"],
        maxResultCount: Math.min(limit ?? 20, 20),
        locationRestriction: {
          circle: { center: { latitude, longitude }, radius: radiusMeters },
        },
      }),
      next: { revalidate: 3600 },
    });

    if (!res.ok) return [];
    const data = (await res.json()) as { places?: GooglePlace[] };
    let results = (data.places ?? []).map((p) => toNormalized(p, apiKey));

    if (cuisines?.length) {
      results = results.filter((r) => r.cuisines.some((c) => cuisines.includes(c)));
    }
    return results;
  },
  async getById(externalId: string) {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) return null;

    const res = await fetch(`https://places.googleapis.com/v1/places/${externalId}`, {
      headers: { "X-Goog-Api-Key": apiKey, "X-Goog-FieldMask": FIELD_MASK.replace(/places\./g, "") },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const place = (await res.json()) as GooglePlace;
    return toNormalized(place, apiKey);
  },
};
