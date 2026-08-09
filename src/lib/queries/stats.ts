import { db, DATABASE_ENABLED, restaurantUserStatus, restaurants, ratings, visits, cuisineProgress } from "@/db";
import { eq, avg, sql } from "drizzle-orm";

export interface ProfileStats {
  restaurantsVisited: number;
  cities: number;
  cuisinesTried: number;
  averageRating: number | null;
  favoriteCuisine: string | null;
  favoriteRestaurant: string | null;
}

export async function getProfileStats(userId: string): Promise<ProfileStats> {
  if (!DATABASE_ENABLED) {
    return { restaurantsVisited: 0, cities: 0, cuisinesTried: 0, averageRating: null, favoriteCuisine: null, favoriteRestaurant: null };
  }
  const db_ = db!;

  const visitedRows = await db_
    .select({ restaurant: restaurants })
    .from(restaurantUserStatus)
    .leftJoin(restaurants, eq(restaurantUserStatus.restaurantId, restaurants.id))
    .where(eq(restaurantUserStatus.userId, userId));

  const visitedRestaurants = visitedRows.map((r) => r.restaurant).filter((r): r is NonNullable<typeof r> => r !== null && Boolean(r));
  const actuallyVisited = await db_.select().from(restaurantUserStatus).where(eq(restaurantUserStatus.userId, userId));
  const visitedCount = actuallyVisited.filter((r) => r.visitCount > 0).length;

  const cities = new Set(visitedRestaurants.map((r) => r.city).filter(Boolean));

  const [avgResult] = await db_
    .select({ value: avg(ratings.overall) })
    .from(ratings)
    .leftJoin(visits, eq(ratings.visitId, visits.id))
    .where(eq(visits.userId, userId));

  const cuisines = await db_.select().from(cuisineProgress).where(eq(cuisineProgress.userId, userId));
  const favoriteCuisine = cuisines.sort((a, b) => b.visitedCount - a.visitedCount)[0]?.cuisine ?? null;

  const [favoriteRow] = await db_
    .select({ name: restaurants.name, overall: ratings.overall })
    .from(ratings)
    .leftJoin(visits, eq(ratings.visitId, visits.id))
    .leftJoin(restaurants, eq(visits.restaurantId, restaurants.id))
    .where(eq(visits.userId, userId))
    .orderBy(sql`${ratings.overall} desc nulls last`)
    .limit(1);

  return {
    restaurantsVisited: visitedCount,
    cities: cities.size,
    cuisinesTried: cuisines.length,
    averageRating: avgResult?.value ? Math.round(Number(avgResult.value) * 10) / 10 : null,
    favoriteCuisine,
    favoriteRestaurant: favoriteRow?.name ?? null,
  };
}
