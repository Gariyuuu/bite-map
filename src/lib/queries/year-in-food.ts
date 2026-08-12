import { db, DATABASE_ENABLED, visits, ratings, restaurants, visitDishes, safeQuery } from "@/db";
import { eq, and, gte, lt, inArray } from "drizzle-orm";

export interface YearInFoodStats {
  year: number;
  hasData: boolean;
  restaurantsVisited: number;
  cuisinesTried: number;
  mealsTogether: number;
  averageRating: number | null;
  mostVisitedRestaurant: { name: string; visits: number } | null;
  highestRatedRestaurant: { name: string; rating: number } | null;
  mostVisitedNeighborhood: { name: string; visits: number } | null;
  favoriteDish: { name: string; restaurantName: string; rating: number } | null;
  mostExpensiveMeal: { restaurantName: string; cost: number } | null;
  cheapestGreatMeal: { restaurantName: string; cost: number; rating: number } | null;
}

const EMPTY: Omit<YearInFoodStats, "year"> = {
  hasData: false,
  restaurantsVisited: 0,
  cuisinesTried: 0,
  mealsTogether: 0,
  averageRating: null,
  mostVisitedRestaurant: null,
  highestRatedRestaurant: null,
  mostVisitedNeighborhood: null,
  favoriteDish: null,
  mostExpensiveMeal: null,
  cheapestGreatMeal: null,
};

export async function getYearInFoodStats(userId: string, year: number): Promise<YearInFoodStats> {
  if (!DATABASE_ENABLED) return { year, ...EMPTY };
  return safeQuery(() => getYearInFoodStatsInner(userId, year), { year, ...EMPTY });
}

async function getYearInFoodStatsInner(userId: string, year: number): Promise<YearInFoodStats> {
  const db_ = db!;

  const yearStart = new Date(Date.UTC(year, 0, 1));
  const yearEnd = new Date(Date.UTC(year + 1, 0, 1));

  const rows = await db_
    .select({ visit: visits, restaurant: restaurants, rating: ratings })
    .from(visits)
    .leftJoin(restaurants, eq(visits.restaurantId, restaurants.id))
    .leftJoin(ratings, eq(ratings.visitId, visits.id))
    .where(and(eq(visits.userId, userId), gte(visits.visitedAt, yearStart), lt(visits.visitedAt, yearEnd)));

  if (rows.length === 0) return { year, ...EMPTY };

  const restaurantIds = new Set<string>();
  const cuisines = new Set<string>();
  const neighborhoodCounts = new Map<string, number>();
  const restaurantVisitCounts = new Map<string, { name: string; count: number }>();
  let mealsTogether = 0;
  let ratingSum = 0;
  let ratingCount = 0;
  let highestRated: { name: string; rating: number } | null = null;
  let mostExpensive: { restaurantName: string; cost: number } | null = null;
  let cheapestGreat: { restaurantName: string; cost: number; rating: number } | null = null;

  for (const { visit, restaurant, rating } of rows) {
    if (restaurant) {
      restaurantIds.add(restaurant.id);
      for (const c of restaurant.cuisines) cuisines.add(c);
      if (restaurant.neighborhood) {
        neighborhoodCounts.set(restaurant.neighborhood, (neighborhoodCounts.get(restaurant.neighborhood) ?? 0) + 1);
      }
      const existing = restaurantVisitCounts.get(restaurant.id);
      restaurantVisitCounts.set(restaurant.id, { name: restaurant.name, count: (existing?.count ?? 0) + 1 });

      if (rating?.overall != null) {
        if (!highestRated || rating.overall > highestRated.rating) {
          highestRated = { name: restaurant.name, rating: rating.overall };
        }
        if (rating.overall >= 8 && visit.costTotal != null) {
          if (!cheapestGreat || visit.costTotal < cheapestGreat.cost) {
            cheapestGreat = { restaurantName: restaurant.name, cost: visit.costTotal, rating: rating.overall };
          }
        }
      }
      if (visit.costTotal != null && (!mostExpensive || visit.costTotal > mostExpensive.cost)) {
        mostExpensive = { restaurantName: restaurant.name, cost: visit.costTotal };
      }
    }
    if ((visit.companions?.length ?? 0) > 0 || visit.sharedSpaceId) mealsTogether += 1;
    if (rating?.overall != null) {
      ratingSum += rating.overall;
      ratingCount += 1;
    }
  }

  let mostVisitedRestaurant: { name: string; visits: number } | null = null;
  for (const { name, count } of restaurantVisitCounts.values()) {
    if (!mostVisitedRestaurant || count > mostVisitedRestaurant.visits) {
      mostVisitedRestaurant = { name, visits: count };
    }
  }

  let mostVisitedNeighborhood: { name: string; visits: number } | null = null;
  for (const [name, count] of neighborhoodCounts.entries()) {
    if (!mostVisitedNeighborhood || count > mostVisitedNeighborhood.visits) {
      mostVisitedNeighborhood = { name, visits: count };
    }
  }

  const visitIds = rows.map((r) => r.visit.id);
  const dishRows = await db_
    .select({ dish: visitDishes, restaurant: restaurants })
    .from(visitDishes)
    .leftJoin(visits, eq(visitDishes.visitId, visits.id))
    .leftJoin(restaurants, eq(visits.restaurantId, restaurants.id))
    .where(inArray(visitDishes.visitId, visitIds));

  let favoriteDish: { name: string; restaurantName: string; rating: number } | null = null;
  for (const { dish, restaurant } of dishRows) {
    if (dish.rating != null && (!favoriteDish || dish.rating > favoriteDish.rating)) {
      favoriteDish = { name: dish.dishName, restaurantName: restaurant?.name ?? "Unknown", rating: dish.rating };
    }
  }

  return {
    year,
    hasData: true,
    restaurantsVisited: restaurantIds.size,
    cuisinesTried: cuisines.size,
    mealsTogether,
    averageRating: ratingCount > 0 ? Math.round((ratingSum / ratingCount) * 10) / 10 : null,
    mostVisitedRestaurant,
    highestRatedRestaurant: highestRated,
    mostVisitedNeighborhood,
    favoriteDish,
    mostExpensiveMeal: mostExpensive,
    cheapestGreatMeal: cheapestGreat,
  };
}
