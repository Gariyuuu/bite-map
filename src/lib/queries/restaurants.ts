import { db, DATABASE_ENABLED, restaurants, restaurantDishes, restaurantUserStatus, restaurantSources } from "@/db";
import { eq, inArray, and, gte, lte } from "drizzle-orm";
import { searchAllProviders } from "@/providers";
import { resolveEntities } from "@/lib/entity-resolution";
import { haversineMiles } from "@/lib/geo";
import { computeConsensus } from "@/lib/consensus";
import { EMPTY_STATUS, type RestaurantCard, type RestaurantStatusFlags } from "@/types/ui";
import type { PriceLevel } from "@/types/restaurant";

interface NearbyOptions {
  latitude: number;
  longitude: number;
  radiusMiles: number;
  query?: string;
  cuisines?: string[];
  limit?: number;
  userId?: string;
}

/** ~1 degree latitude ≈ 69 miles; used as a cheap bounding-box pre-filter before haversine. */
function boxDegrees(radiusMiles: number) {
  return radiusMiles / 69;
}

async function attachStatuses(cards: RestaurantCard[], userId?: string): Promise<RestaurantCard[]> {
  if (!userId || !DATABASE_ENABLED || cards.length === 0) return cards;

  const rows = await db!
    .select()
    .from(restaurantUserStatus)
    .where(
      and(
        eq(restaurantUserStatus.userId, userId),
        inArray(
          restaurantUserStatus.restaurantId,
          cards.map((c) => c.id)
        )
      )
    );

  const byId = new Map(rows.map((r) => [r.restaurantId, r]));
  return cards.map((c) => {
    const row = byId.get(c.id);
    if (!row) return c;
    const status: RestaurantStatusFlags = {
      isWishlist: row.isWishlist,
      isFavorite: row.isFavorite,
      isPlanned: row.isPlanned,
      visitCount: row.visitCount,
      lastVisitedAt: row.lastVisitedAt?.toISOString(),
      wouldReturn: row.wouldReturn,
    };
    return { ...c, status };
  });
}

export async function getNearbyRestaurants(opts: NearbyOptions): Promise<RestaurantCard[]> {
  const { latitude, longitude, radiusMiles, query, cuisines, limit = 60, userId } = opts;

  let cards: RestaurantCard[];

  if (DATABASE_ENABLED) {
    const delta = boxDegrees(radiusMiles);
    const rows = await db!
      .select()
      .from(restaurants)
      .where(
        and(
          gte(restaurants.latitude, latitude - delta),
          lte(restaurants.latitude, latitude + delta),
          gte(restaurants.longitude, longitude - delta),
          lte(restaurants.longitude, longitude + delta)
        )
      );

    cards = rows
      .map((r) => {
        const distanceMiles = haversineMiles(latitude, longitude, r.latitude, r.longitude);
        return { row: r, distanceMiles };
      })
      .filter((r) => r.distanceMiles <= radiusMiles)
      .sort((a, b) => a.distanceMiles - b.distanceMiles)
      .slice(0, limit)
      .map(({ row: r, distanceMiles }): RestaurantCard => ({
        id: r.id,
        name: r.name,
        latitude: r.latitude,
        longitude: r.longitude,
        address: r.address ?? undefined,
        city: r.city ?? undefined,
        neighborhood: r.neighborhood ?? undefined,
        cuisines: r.cuisines ?? [],
        priceLevel: r.priceLevel ?? undefined,
        heroPhotoUrl: r.heroPhotoUrl ?? undefined,
        photos: r.heroPhotoUrl ? [r.heroPhotoUrl] : [],
        website: r.website ?? undefined,
        phone: r.phone ?? undefined,
        openingHours: r.openingHours ?? undefined,
        dishes: [],
        consensusScore: r.consensusScore ?? undefined,
        consensusConfidence: (r.consensusConfidence as RestaurantCard["consensusConfidence"]) ?? undefined,
        popularityScore: r.popularityScore ?? undefined,
        trendingScore: r.trendingScore ?? undefined,
        distanceMiles,
        source: "db",
      }));

    if (query) {
      const q = query.toLowerCase();
      cards = cards.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.cuisines.some((cu) => cu.toLowerCase().includes(q)) ||
          c.neighborhood?.toLowerCase().includes(q)
      );
    }
    if (cuisines?.length) {
      cards = cards.filter((c) => c.cuisines.some((cu) => cuisines.includes(cu)));
    }
  } else {
    const raw = await searchAllProviders({
      latitude,
      longitude,
      radiusMeters: radiusMiles * 1609.34,
      query,
      cuisines,
      limit,
    });
    const resolved = resolveEntities(raw);

    cards = resolved
      .map(({ primary, sources }) => {
        const distanceMiles = haversineMiles(latitude, longitude, primary.latitude, primary.longitude);
        const consensus = computeConsensus(
          sources
            .filter((s) => s.rating != null && s.ratingCount != null)
            .map((s) => ({
              provider: s.provider,
              rating: s.rating!,
              ratingScale: s.ratingScale ?? 5,
              ratingCount: s.ratingCount!,
            }))
        );
        const card: RestaurantCard = {
          id: `${primary.provider}:${primary.externalId}`,
          name: primary.name,
          latitude: primary.latitude,
          longitude: primary.longitude,
          address: primary.address,
          city: primary.city,
          neighborhood: primary.neighborhood,
          cuisines: primary.cuisines,
          priceLevel: primary.priceLevel,
          heroPhotoUrl: primary.photos?.[0],
          photos: primary.photos ?? [],
          website: primary.website,
          phone: primary.phone,
          openingHours: primary.openingHours,
          dishes: primary.signatureDishes ?? [],
          consensusScore: consensus?.score,
          consensusConfidence: consensus?.confidence,
          popularityScore: undefined,
          distanceMiles,
          source: primary.provider === "mock" ? "mock" : "live",
        };
        return card;
      })
      .sort((a, b) => (a.distanceMiles ?? 0) - (b.distanceMiles ?? 0))
      .slice(0, limit);
  }

  return attachStatuses(cards, userId);
}

export async function getRestaurantById(id: string, userId?: string): Promise<RestaurantCard | null> {
  if (DATABASE_ENABLED && id.startsWith("rst_")) {
    const [row] = await db!.select().from(restaurants).where(eq(restaurants.id, id));
    if (!row) return null;
    const dishes = await db!.select().from(restaurantDishes).where(eq(restaurantDishes.restaurantId, id));
    const sourceRows = await db!.select().from(restaurantSources).where(eq(restaurantSources.restaurantId, id));

    const card: RestaurantCard = {
      id: row.id,
      name: row.name,
      latitude: row.latitude,
      longitude: row.longitude,
      address: row.address ?? undefined,
      city: row.city ?? undefined,
      neighborhood: row.neighborhood ?? undefined,
      cuisines: row.cuisines ?? [],
      priceLevel: row.priceLevel ?? undefined,
      heroPhotoUrl: row.heroPhotoUrl ?? undefined,
      photos: row.heroPhotoUrl ? [row.heroPhotoUrl] : [],
      website: row.website ?? undefined,
      phone: row.phone ?? undefined,
      openingHours: row.openingHours ?? undefined,
      dishes: dishes.map((d) => ({
        name: d.name,
        description: d.description ?? undefined,
        photoUrl: d.photoUrl ?? undefined,
        estimatedPrice: d.estimatedPrice ?? undefined,
        spiceLevel: (d.spiceLevel ?? undefined) as 0 | 1 | 2 | 3 | undefined,
        dietaryTags: d.dietaryTags ?? [],
        priority: d.priority ?? undefined,
        whyOrder: d.whyOrder ?? undefined,
      })),
      consensusScore: row.consensusScore ?? undefined,
      consensusConfidence: (row.consensusConfidence as RestaurantCard["consensusConfidence"]) ?? undefined,
      popularityScore: row.popularityScore ?? undefined,
      trendingScore: row.trendingScore ?? undefined,
      sources: sourceRows.map((s) => ({
        provider: s.provider,
        rating: s.rating ?? 0,
        ratingScale: s.ratingScale ?? 5,
        ratingCount: s.ratingCount ?? 0,
      })),
      source: "db",
    };

    const [withStatus] = await attachStatuses([card], userId);
    return withStatus ?? card;
  }

  // Fallback: id is "provider:externalId" from the live/mock path.
  const [provider, externalId] = id.includes(":") ? id.split(/:(.+)/) : [null, null];
  if (!provider || !externalId) return null;

  const { allProviders } = await import("@/providers");
  const adapter = allProviders.find((p) => p.id === provider);
  const result = await adapter?.getById(externalId);
  if (!result) return null;

  return {
    id,
    name: result.name,
    latitude: result.latitude,
    longitude: result.longitude,
    address: result.address,
    city: result.city,
    neighborhood: result.neighborhood,
    cuisines: result.cuisines,
    priceLevel: result.priceLevel as PriceLevel | undefined,
    heroPhotoUrl: result.photos?.[0],
    photos: result.photos ?? [],
    website: result.website,
    phone: result.phone,
    openingHours: result.openingHours,
    dishes: result.signatureDishes ?? [],
    consensusScore: result.rating != null ? computeConsensus([
      { provider: result.provider, rating: result.rating, ratingScale: result.ratingScale ?? 5, ratingCount: result.ratingCount ?? 0 },
    ])?.score : undefined,
    sources:
      result.rating != null
        ? [{ provider: result.provider, rating: result.rating, ratingScale: result.ratingScale ?? 5, ratingCount: result.ratingCount ?? 0 }]
        : [],
    status: EMPTY_STATUS,
    source: result.provider === "mock" ? "mock" : "live",
  };
}
