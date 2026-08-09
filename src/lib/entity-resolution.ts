import type { NormalizedRestaurant } from "@/types/restaurant";
import { haversineMiles } from "./geo";

const MATCH_RADIUS_MILES = 0.03; // ~50 meters — same building/plaza

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function namesMatch(a: string, b: string): boolean {
  const na = normalizeName(a);
  const nb = normalizeName(b);
  if (na === nb) return true;
  return na.length > 3 && nb.length > 3 && (na.includes(nb) || nb.includes(na));
}

function completeness(r: NormalizedRestaurant): number {
  return [r.photos?.length, r.website, r.phone, r.openingHours, r.signatureDishes?.length].filter(
    Boolean
  ).length;
}

export interface ResolvedRestaurant {
  primary: NormalizedRestaurant;
  sources: NormalizedRestaurant[];
}

/**
 * Merges raw results from multiple providers into one canonical restaurant
 * per real-world location, matched on proximity + fuzzy name (no shared ID
 * exists across Google/Yelp/Foursquare/OSM). This runs before anything is
 * persisted or rendered so we never show duplicate pins for the same place.
 */
export function resolveEntities(records: NormalizedRestaurant[]): ResolvedRestaurant[] {
  const clusters: ResolvedRestaurant[] = [];

  for (const record of records) {
    const match = clusters.find(
      (c) =>
        namesMatch(c.primary.name, record.name) &&
        haversineMiles(c.primary.latitude, c.primary.longitude, record.latitude, record.longitude) <=
          MATCH_RADIUS_MILES
    );

    if (match) {
      match.sources.push(record);
      if (completeness(record) > completeness(match.primary)) {
        match.primary = record;
      }
    } else {
      clusters.push({ primary: record, sources: [record] });
    }
  }

  return clusters;
}
