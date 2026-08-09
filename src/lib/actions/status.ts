"use server";

import { getDb, DATABASE_ENABLED, users, profiles, preferences, restaurantUserStatus, visits, ratings, visitDishes, journalEntries, cuisineProgress, restaurants } from "@/db";
import { sql, eq } from "drizzle-orm";
import { getCurrentUserId } from "@/lib/auth";
import { id } from "@/lib/id";
import { syncAchievements } from "@/lib/achievements";
import { revalidatePath } from "next/cache";

/** Lazily creates the local user row on first write — no Clerk webhook required. */
async function ensureUser(userId: string) {
  const db = getDb();
  await db.insert(users).values({ id: userId, email: `${userId}@example.com` }).onConflictDoNothing();
  await db.insert(profiles).values({ userId }).onConflictDoNothing();
  await db.insert(preferences).values({ userId }).onConflictDoNothing();
}

async function upsertStatus(restaurantId: string, patch: Partial<typeof restaurantUserStatus.$inferInsert>) {
  if (!DATABASE_ENABLED) {
    throw new Error("Connect a database (DATABASE_URL) to save restaurant status.");
  }
  const db = getDb();
  const userId = await getCurrentUserId();
  await ensureUser(userId);

  await db
    .insert(restaurantUserStatus)
    .values({ userId, restaurantId, ...patch })
    .onConflictDoUpdate({
      target: [restaurantUserStatus.userId, restaurantUserStatus.restaurantId],
      set: { ...patch, updatedAt: new Date() },
    });

  revalidatePath("/map");
  revalidatePath("/discover");
  revalidatePath(`/restaurant/${restaurantId}`);
}

export async function toggleWishlist(restaurantId: string, next: boolean) {
  await upsertStatus(restaurantId, { isWishlist: next });
}

export async function toggleFavorite(restaurantId: string, next: boolean) {
  await upsertStatus(restaurantId, { isFavorite: next });
}

export async function togglePlanned(restaurantId: string, next: boolean) {
  await upsertStatus(restaurantId, { isPlanned: next });
}

interface QuickCheckInInput {
  restaurantId: string;
  restaurantName: string;
  cuisines: string[];
}

/** Rapid-import mode (section 58): mark visited with no form, backfill details later. */
export async function quickCheckIn({ restaurantId, restaurantName, cuisines }: QuickCheckInInput) {
  if (!DATABASE_ENABLED) {
    throw new Error("Connect a database (DATABASE_URL) to save visits.");
  }
  const db = getDb();
  const userId = await getCurrentUserId();
  await ensureUser(userId);

  const visitId = id("vis");
  const visitedAt = new Date();

  await db.insert(visits).values({ id: visitId, userId, restaurantId, visitedAt });
  await db.insert(journalEntries).values({
    id: id("jnl"),
    userId,
    visitId,
    restaurantId,
    title: restaurantName,
    body: `Marked ${restaurantName} as visited.`,
  });

  await db
    .insert(restaurantUserStatus)
    .values({ userId, restaurantId, visitCount: 1, lastVisitedAt: visitedAt })
    .onConflictDoUpdate({
      target: [restaurantUserStatus.userId, restaurantUserStatus.restaurantId],
      set: { visitCount: sql`${restaurantUserStatus.visitCount} + 1`, lastVisitedAt: visitedAt },
    });

  for (const cuisine of cuisines) {
    await db
      .insert(cuisineProgress)
      .values({ userId, cuisine, visitedCount: 1, recommendedTotal: 20 })
      .onConflictDoUpdate({
        target: [cuisineProgress.userId, cuisineProgress.cuisine],
        set: { visitedCount: sql`${cuisineProgress.visitedCount} + 1` },
      });
  }

  await syncAchievements(userId);

  revalidatePath("/map");
  revalidatePath("/discover");
  revalidatePath("/journal");
  revalidatePath(`/restaurant/${restaurantId}`);
}

export interface LogVisitInput {
  restaurantId: string;
  restaurantName: string;
  visitedAt: string; // ISO date
  mealType?: "breakfast" | "brunch" | "lunch" | "dinner" | "dessert" | "drinks" | "snack";
  companions?: string[];
  costTotal?: number;
  notes?: string;
  wouldReturn?: boolean;
  overall?: number;
  food?: number;
  value?: number;
  service?: number;
  atmosphere?: number;
  dishes?: { name: string; rating?: number }[];
}

/** Full detailed visit log — journal entry, ratings, and dish ratings in one write (section 17-19). */
export async function logVisit(input: LogVisitInput) {
  if (!DATABASE_ENABLED) {
    throw new Error("Connect a database (DATABASE_URL) to save visits.");
  }
  const db = getDb();
  const userId = await getCurrentUserId();
  await ensureUser(userId);

  const visitId = id("vis");
  const visitedAt = new Date(input.visitedAt);

  await db.insert(visits).values({
    id: visitId,
    userId,
    restaurantId: input.restaurantId,
    visitedAt,
    mealType: input.mealType,
    companions: input.companions ?? [],
    costTotal: input.costTotal,
    notes: input.notes,
    wouldReturn: input.wouldReturn,
  });

  if (input.overall != null) {
    await db.insert(ratings).values({
      id: id("rat"),
      visitId,
      overall: input.overall,
      food: input.food,
      value: input.value,
      service: input.service,
      atmosphere: input.atmosphere,
    });
  }

  for (const dish of input.dishes ?? []) {
    await db.insert(visitDishes).values({ id: id("vdh"), visitId, dishName: dish.name, rating: dish.rating });
  }

  await db.insert(journalEntries).values({
    id: id("jnl"),
    userId,
    visitId,
    restaurantId: input.restaurantId,
    title: input.restaurantName,
    body: input.notes,
    mood: input.overall != null ? (input.overall >= 8 ? "loved it" : "pretty good") : undefined,
  });

  await db
    .insert(restaurantUserStatus)
    .values({
      userId,
      restaurantId: input.restaurantId,
      visitCount: 1,
      lastVisitedAt: visitedAt,
      wouldReturn: input.wouldReturn,
      isFavorite: (input.overall ?? 0) >= 9,
    })
    .onConflictDoUpdate({
      target: [restaurantUserStatus.userId, restaurantUserStatus.restaurantId],
      set: {
        visitCount: sql`${restaurantUserStatus.visitCount} + 1`,
        lastVisitedAt: visitedAt,
        wouldReturn: input.wouldReturn,
      },
    });

  const [restaurant] = await db.select({ cuisines: restaurants.cuisines }).from(restaurants).where(eq(restaurants.id, input.restaurantId));
  for (const cuisine of restaurant?.cuisines ?? []) {
    await db
      .insert(cuisineProgress)
      .values({ userId, cuisine, visitedCount: 1, recommendedTotal: 20 })
      .onConflictDoUpdate({
        target: [cuisineProgress.userId, cuisineProgress.cuisine],
        set: { visitedCount: sql`${cuisineProgress.visitedCount} + 1` },
      });
  }

  await syncAchievements(userId);

  revalidatePath("/map");
  revalidatePath("/discover");
  revalidatePath("/journal");
  revalidatePath(`/restaurant/${input.restaurantId}`);
}

export async function isDbConfigured() {
  return DATABASE_ENABLED;
}
