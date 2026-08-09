import { db, DATABASE_ENABLED, achievements, restaurantUserStatus, restaurants, cuisineProgress } from "@/db";
import { eq, and, gt } from "drizzle-orm";

export interface AchievementDef {
  key: string;
  label: string;
  description: string;
  emoji: string;
}

/** Catalog from spec section 31. Thresholds are tuned for a real (not padded) visit history. */
export const ACHIEVEMENTS: AchievementDef[] = [
  { key: "RAMEN_ROOKIE", label: "Ramen Rookie", description: "Visit your first ramen shop", emoji: "🍜" },
  { key: "RAMEN_EXPERT", label: "Ramen Expert", description: "Visit 5 different ramen shops", emoji: "🍜" },
  { key: "DIM_SUM_EXPLORER", label: "Dim Sum Explorer", description: "Visit 3 dim sum restaurants", emoji: "🥟" },
  { key: "KBBQ_ADDICT", label: "KBBQ Addict", description: "Visit 5 Korean BBQ restaurants", emoji: "🔥" },
  { key: "HUNDRED_RESTAURANTS", label: "100 Restaurants", description: "Visit 100 restaurants", emoji: "💯" },
  { key: "FIFTY_DATE_NIGHTS", label: "50 Date Nights", description: "Visit 50 date-night restaurants", emoji: "💕" },
  { key: "MICHELIN_EXPLORER", label: "Michelin Explorer", description: "Visit 3 fine-dining restaurants", emoji: "⭐" },
  { key: "TEN_CUISINES", label: "10 Cuisines", description: "Try 10 different cuisines", emoji: "🌏" },
  { key: "TWENTYFIVE_CUISINES", label: "25 Cuisines", description: "Try 25 different cuisines", emoji: "🗺️" },
];

/**
 * Recomputes which achievements a user qualifies for and inserts any newly
 * unlocked ones (onConflictDoNothing preserves the original unlock date).
 * Called after every visit-logging action rather than on a schedule — cheap
 * enough given the small per-user row counts, and keeps unlocks instant.
 */
export async function syncAchievements(userId: string): Promise<void> {
  if (!DATABASE_ENABLED) return;
  const db_ = db!;

  const visited = await db_
    .select({ cuisines: restaurants.cuisines, priceLevel: restaurants.priceLevel })
    .from(restaurantUserStatus)
    .leftJoin(restaurants, eq(restaurantUserStatus.restaurantId, restaurants.id))
    .where(and(eq(restaurantUserStatus.userId, userId), gt(restaurantUserStatus.visitCount, 0)));

  const cuisineRows = await db_.select().from(cuisineProgress).where(eq(cuisineProgress.userId, userId));
  const cuisineVisitCount = (name: string) =>
    cuisineRows.find((c) => c.cuisine.toLowerCase() === name.toLowerCase())?.visitedCount ?? 0;

  const restaurantsWith = (tag: string) =>
    visited.filter((r) => r?.cuisines?.some((c) => c.toLowerCase().includes(tag.toLowerCase()))).length;

  const unlocked = new Set<string>();
  const ramenCount = cuisineVisitCount("Ramen");
  if (ramenCount >= 1) unlocked.add("RAMEN_ROOKIE");
  if (ramenCount >= 5) unlocked.add("RAMEN_EXPERT");
  if (restaurantsWith("Dim Sum") >= 3) unlocked.add("DIM_SUM_EXPLORER");
  if (cuisineVisitCount("Korean BBQ") >= 5) unlocked.add("KBBQ_ADDICT");
  if (visited.length >= 100) unlocked.add("HUNDRED_RESTAURANTS");
  if (restaurantsWith("Date Night") >= 50) unlocked.add("FIFTY_DATE_NIGHTS");
  if (restaurantsWith("Fine Dining") >= 3) unlocked.add("MICHELIN_EXPLORER");
  if (cuisineRows.length >= 10) unlocked.add("TEN_CUISINES");
  if (cuisineRows.length >= 25) unlocked.add("TWENTYFIVE_CUISINES");

  for (const key of unlocked) {
    await db_
      .insert(achievements)
      .values({ userId, key })
      .onConflictDoNothing();
  }
}

export interface AchievementStatus extends AchievementDef {
  unlockedAt: Date | null;
}

export async function getAchievementStatus(userId: string): Promise<AchievementStatus[]> {
  if (!DATABASE_ENABLED) {
    return ACHIEVEMENTS.map((a) => ({ ...a, unlockedAt: null }));
  }
  const rows = await db!.select().from(achievements).where(eq(achievements.userId, userId));
  const byKey = new Map(rows.map((r) => [r.key, r.unlockedAt]));
  return ACHIEVEMENTS.map((a) => ({ ...a, unlockedAt: byKey.get(a.key) ?? null }));
}
