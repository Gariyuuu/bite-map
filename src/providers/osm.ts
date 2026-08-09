import type { NormalizedRestaurant } from "@/types/restaurant";
import type { NearbySearchParams, RestaurantProvider } from "./types";

interface OverpassElement {
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

function toNormalized(el: OverpassElement): NormalizedRestaurant | null {
  const lat = el.lat ?? el.center?.lat;
  const lon = el.lon ?? el.center?.lon;
  const tags = el.tags ?? {};
  if (!lat || !lon || !tags.name) return null;

  return {
    provider: "osm",
    externalId: String(el.id),
    name: tags.name,
    latitude: lat,
    longitude: lon,
    address: [tags["addr:housenumber"], tags["addr:street"]].filter(Boolean).join(" ") || undefined,
    city: tags["addr:city"],
    zip: tags["addr:postcode"],
    cuisines: tags.cuisine ? tags.cuisine.split(";").map((c) => c.trim()) : [],
    website: tags.website,
    phone: tags.phone,
    osmId: String(el.id),
  };
}

/**
 * OpenStreetMap via the public Overpass API. No key required, but it's a
 * shared community resource with strict rate limits — opt in explicitly via
 * ENABLE_OSM_PROVIDER so we never hammer it by default (see section 55, API
 * cost/quota protection applies to "free" providers too).
 */
export const osmProvider: RestaurantProvider = {
  id: "osm",
  isConfigured() {
    return process.env.ENABLE_OSM_PROVIDER === "true";
  },
  async searchNearby({ latitude, longitude, radiusMeters }: NearbySearchParams) {
    if (!this.isConfigured()) return [];

    const query = `
      [out:json][timeout:15];
      node["amenity"="restaurant"](around:${Math.min(radiusMeters, 5000)},${latitude},${longitude});
      out center 50;
    `;

    const res = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: query,
      next: { revalidate: 21600 },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { elements?: OverpassElement[] };
    return (data.elements ?? [])
      .map(toNormalized)
      .filter((r): r is NormalizedRestaurant => r !== null);
  },
  async getById() {
    // Overpass has no single-node-by-id restaurant lookup worth wiring up;
    // OSM results are only ever surfaced via searchNearby.
    return null;
  },
};
