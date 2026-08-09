import { db, DATABASE_ENABLED, journalEntries, restaurants, visits, ratings } from "@/db";
import { eq, desc } from "drizzle-orm";

export interface JournalEntryData {
  id: string;
  title: string | null;
  body: string | null;
  mood: string | null;
  createdAt: Date;
  restaurant: { id: string; name: string; heroPhotoUrl: string | null; cuisines: string[] } | null;
  visit: { visitedAt: Date; companions: string[] | null; costTotal: number | null; mealType: string | null } | null;
  overallRating: number | null;
}

export async function getJournalEntries(userId: string): Promise<JournalEntryData[]> {
  if (!DATABASE_ENABLED) return [];

  const rows = await db!
    .select({
      entry: journalEntries,
      restaurant: restaurants,
      visit: visits,
      rating: ratings,
    })
    .from(journalEntries)
    .leftJoin(restaurants, eq(journalEntries.restaurantId, restaurants.id))
    .leftJoin(visits, eq(journalEntries.visitId, visits.id))
    .leftJoin(ratings, eq(ratings.visitId, visits.id))
    .where(eq(journalEntries.userId, userId))
    .orderBy(desc(journalEntries.createdAt));

  return rows.map(({ entry, restaurant, visit, rating }) => ({
    id: entry.id,
    title: entry.title,
    body: entry.body,
    mood: entry.mood,
    createdAt: entry.createdAt,
    restaurant: restaurant
      ? { id: restaurant.id, name: restaurant.name, heroPhotoUrl: restaurant.heroPhotoUrl, cuisines: restaurant.cuisines }
      : null,
    visit: visit
      ? { visitedAt: visit.visitedAt, companions: visit.companions, costTotal: visit.costTotal, mealType: visit.mealType }
      : null,
    overallRating: rating?.overall ?? null,
  }));
}
