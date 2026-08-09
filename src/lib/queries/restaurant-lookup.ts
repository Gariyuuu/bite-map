import { db, DATABASE_ENABLED, restaurants, restaurantDishes } from "@/db";
import { ilike, eq } from "drizzle-orm";
import { mockRestaurants, photoUrl } from "@/db/seed/data";
import { computeConsensus } from "@/lib/consensus";
import type { ConsensusConfidence } from "@/types/restaurant";

export interface AiRecommendationCard {
  restaurantId: string;
  name: string;
  heroPhotoUrl: string | null;
  cuisines: string[];
  priceLevel: string | null;
  consensusScore: number | null;
  consensusConfidence: ConsensusConfidence | null;
  mustOrderDishes: string[];
}

/**
 * Resolves a restaurant name the AI mentioned in its reply to real data from
 * our own database — we never trust the LLM for scores/dishes, only for
 * which restaurant it's pointing at. See lib/ai-recommendation.ts for how
 * the name is extracted from the reply text.
 */
export async function findRestaurantCardByName(name: string): Promise<AiRecommendationCard | null> {
  const cleaned = name.trim();
  if (!cleaned) return null;

  if (DATABASE_ENABLED) {
    const db_ = db!;
    const [match] = await db_.select().from(restaurants).where(ilike(restaurants.name, `%${cleaned}%`)).limit(1);
    if (!match) return null;

    const dishes = await db_
      .select()
      .from(restaurantDishes)
      .where(eq(restaurantDishes.restaurantId, match.id));
    const mustOrder = dishes.filter((d) => d.priority === "must_try").slice(0, 2).map((d) => d.name);

    return {
      restaurantId: match.id,
      name: match.name,
      heroPhotoUrl: match.heroPhotoUrl,
      cuisines: match.cuisines,
      priceLevel: match.priceLevel,
      consensusScore: match.consensusScore,
      consensusConfidence: match.consensusConfidence as ConsensusConfidence | null,
      mustOrderDishes: mustOrder,
    };
  }

  // Mock fallback (no DATABASE_URL configured yet).
  const lower = cleaned.toLowerCase();
  const match = mockRestaurants.find((r) => r.name.toLowerCase().includes(lower));
  if (!match) return null;

  const consensus = computeConsensus(
    match.sources.map((s) => ({ provider: s.provider, rating: s.rating, ratingScale: s.ratingScale, ratingCount: s.ratingCount }))
  );

  return {
    restaurantId: `mock:${match.id}`,
    name: match.name,
    heroPhotoUrl: match.photoSeeds[0] ? photoUrl(match.photoSeeds[0]) : null,
    cuisines: match.cuisines,
    priceLevel: match.priceLevel,
    consensusScore: consensus?.score ?? null,
    consensusConfidence: consensus?.confidence ?? null,
    mustOrderDishes: match.dishes.filter((d) => d.priority === "must_try").slice(0, 2).map((d) => d.name),
  };
}
