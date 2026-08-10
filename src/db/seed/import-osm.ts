/**
 * One-time-ish import of REAL restaurants from OpenStreetMap (free, no API
 * key) to replace fabricated demo listings with actual places. Run with:
 *   npx tsx --env-file=.env.local src/db/seed/import-osm.ts
 *
 * User feedback: fabricated demo restaurants don't show up on real maps and
 * that's not what they want to browse. Google Places/Yelp would give richer
 * data (ratings, hours, photos) but need a paid-tier API key only the repo
 * owner can create. OSM/Overpass has no such gate and, as verified against
 * the University Town Center area, has solid real coverage for OC/LA.
 *
 * Trade-off: no ratings/reviews come from OSM, so imported restaurants get
 * no restaurant_sources / consensus score — deliberately left blank rather
 * than fabricated, since making up a rating for a REAL place is worse than
 * making up a whole fake one. Every UI surface (SourceBreakdown, DishGuide,
 * ConsensusBadge) already renders correctly with nothing to show.
 */
import { getDb } from "@/db";
import { restaurants } from "@/db/schema";
import { haversineMiles } from "@/lib/geo";
import { readFileSync } from "node:fs";

interface QueryCenter {
  label: string;
  city: string;
  zip: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  /** If set and readable, used instead of a live query (a previously-successful capture). */
  cacheFile?: string;
}

// Major hub neighborhoods across the app's coverage area — prioritizes the
// user's own area first, then the other primary discovery hubs.
const QUERY_CENTERS: QueryCenter[] = [
  {
    label: "University Town Center",
    city: "Irvine",
    zip: "92612",
    latitude: 33.6455,
    longitude: -117.8395,
    radiusMeters: 5000,
    cacheFile: "/tmp/osm_test4.json",
  },
  { label: "Turtle Rock", city: "Irvine", zip: "92603", latitude: 33.6428, longitude: -117.7975, radiusMeters: 4000 },
  { label: "Irvine Spectrum", city: "Irvine", zip: "92618", latitude: 33.6595, longitude: -117.7455, radiusMeters: 4000 },
  { label: "Diamond Jamboree", city: "Irvine", zip: "92618", latitude: 33.684, longitude: -117.808, radiusMeters: 3000 },
  { label: "South Coast Metro", city: "Costa Mesa", zip: "92626", latitude: 33.69, longitude: -117.886, radiusMeters: 4000 },
  { label: "Fashion Island", city: "Newport Beach", zip: "92660", latitude: 33.6178, longitude: -117.8722, radiusMeters: 4000 },
  { label: "Little Saigon", city: "Westminster", zip: "92683", latitude: 33.7412, longitude: -117.9989, radiusMeters: 4000 },
  { label: "Koreatown", city: "Los Angeles", zip: "90005", latitude: 34.058, longitude: -118.3, radiusMeters: 4000 },
  { label: "Little Tokyo", city: "Los Angeles", zip: "90012", latitude: 34.0492, longitude: -118.2396, radiusMeters: 3000 },
  { label: "Sawtelle Japantown", city: "Los Angeles", zip: "90025", latitude: 34.0367, longitude: -118.4436, radiusMeters: 3000 },
  { label: "Arts District", city: "Los Angeles", zip: "90021", latitude: 34.0403, longitude: -118.2352, radiusMeters: 3000 },
];

// overpass.osm.ch responds successfully but with an empty/unsynced database
// (its osm3s timestamp is a bogus sequence number, not a real date) — not
// included. The public Overpass network runs hot; both of these fail
// outright fairly often, hence the aggressive retry/backoff below.
const OVERPASS_ENDPOINTS = ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter"];

interface OsmElement {
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

async function queryOverpass(center: QueryCenter, attempt = 0): Promise<OsmElement[]> {
  if (center.cacheFile) {
    try {
      const cached = JSON.parse(readFileSync(center.cacheFile, "utf-8")) as { elements?: OsmElement[] };
      if (cached.elements?.length) {
        console.log(`  (using previously-captured data for ${center.label})`);
        return cached.elements;
      }
    } catch {
      // fall through to a live query
    }
  }

  const endpoint = OVERPASS_ENDPOINTS[attempt % OVERPASS_ENDPOINTS.length];
  const query = `[out:json][timeout:25];node["amenity"="restaurant"](around:${center.radiusMeters},${center.latitude},${center.longitude});out center 100;`;

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      body: `data=${encodeURIComponent(query)}`,
      signal: AbortSignal.timeout(20000),
    });
    const text = await res.text();
    const data = JSON.parse(text) as { elements?: OsmElement[] };
    return data.elements ?? [];
  } catch {
    if (attempt < 7) {
      await new Promise((r) => setTimeout(r, 4000 + attempt * 1000));
      return queryOverpass(center, attempt + 1);
    }
    console.log(`  (skipping ${center.label} — Overpass unavailable after retries)`);
    return [];
  }
}

function titleCaseCuisine(raw: string): string[] {
  return raw
    .split(";")
    .map((c) => c.trim())
    .filter(Boolean)
    .map((c) =>
      c
        .replace(/_/g, " ")
        .split(" ")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ")
    );
}

async function main() {
  const db = getDb();

  console.log("Loading existing restaurants for dedup...");
  const existing = await db.select({ id: restaurants.id, name: restaurants.name, latitude: restaurants.latitude, longitude: restaurants.longitude }).from(restaurants);
  const existingIndex = existing.map((r) => ({ ...r, nameLower: r.name.toLowerCase() }));

  function isDuplicate(name: string, lat: number, lng: number): boolean {
    const nameLower = name.toLowerCase();
    return existingIndex.some(
      (r) => haversineMiles(lat, lng, r.latitude, r.longitude) < 0.2 && (r.nameLower === nameLower || r.nameLower.includes(nameLower) || nameLower.includes(r.nameLower))
    );
  }

  let imported = 0;
  let skippedDup = 0;
  let skippedNoName = 0;

  for (const center of QUERY_CENTERS) {
    console.log(`Querying OSM near ${center.label}...`);
    const elements = await queryOverpass(center);
    console.log(`  ${elements.length} raw results`);

    for (const el of elements) {
      const tags = el.tags ?? {};
      const lat = el.lat ?? el.center?.lat;
      const lon = el.lon ?? el.center?.lon;
      if (!tags.name || lat == null || lon == null) {
        skippedNoName++;
        continue;
      }
      if (isDuplicate(tags.name, lat, lon)) {
        skippedDup++;
        continue;
      }

      const restaurantId = `rst_osm_${el.id}`;
      const address = [tags["addr:housenumber"], tags["addr:street"]].filter(Boolean).join(" ") || undefined;

      await db
        .insert(restaurants)
        .values({
          id: restaurantId,
          name: tags.name,
          latitude: lat,
          longitude: lon,
          address,
          city: tags["addr:city"] ?? center.city,
          // Only trust the hub's neighborhood label when OSM's own addr:city
          // roughly agrees — a wide radius reaches into adjacent real
          // neighborhoods (e.g. Fashion Island restaurants show up in a
          // University Town Center query), and mislabeling a real place's
          // neighborhood is worse than leaving it blank.
          neighborhood: !tags["addr:city"] || tags["addr:city"] === center.city ? center.label : undefined,
          zip: tags["addr:postcode"] ?? center.zip,
          cuisines: tags.cuisine ? titleCaseCuisine(tags.cuisine) : [],
          website: tags.website ?? tags["contact:website"],
          phone: tags.phone ?? tags["contact:phone"],
          heroPhotoUrl: `https://picsum.photos/seed/osm-${el.id}/800/600`,
          isFabricated: false,
        })
        .onConflictDoNothing();

      existingIndex.push({ id: restaurantId, name: tags.name, nameLower: tags.name.toLowerCase(), latitude: lat, longitude: lon });
      imported++;
    }

    // Be a considerate citizen of a free shared resource between queries.
    await new Promise((r) => setTimeout(r, 4000));
  }

  console.log(`Done. Imported ${imported} real restaurants (skipped ${skippedDup} likely duplicates, ${skippedNoName} unnamed nodes).`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
