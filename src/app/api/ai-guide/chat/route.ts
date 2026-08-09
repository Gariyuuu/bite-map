import { NextResponse, type NextRequest } from "next/server";
import { askYuu, isYuuConfigured, type YuuMessage } from "@/services/yuu-ai";
import { buildAssistantResponse } from "@/lib/ai-recommendation";
import { getCurrentUserId } from "@/lib/auth";
import { getNearbyRestaurants } from "@/lib/queries/restaurants";
import { DEFAULT_LOCATION } from "@/lib/neighborhoods";
import { db, DATABASE_ENABLED, preferences, journalEntries, restaurants, visits, ratings, wishlists, sharedSpaceMembers } from "@/db";
import { eq, desc } from "drizzle-orm";

export async function POST(req: NextRequest) {
  if (!isYuuConfigured()) {
    return NextResponse.json({
      reply:
        "YUU isn't connected yet — add YUU_API_URL and YUU_API_KEY to .env.local to enable live recommendations. Once connected, I'll use your visit history, ratings, and preferences to suggest where to eat next.",
      card: null,
      configured: false,
    });
  }

  const { messages } = (await req.json()) as { messages: YuuMessage[] };
  const userId = await getCurrentUserId();

  let context: Parameters<typeof askYuu>[1] = {};

  const nearby = await getNearbyRestaurants({
    latitude: DEFAULT_LOCATION.latitude,
    longitude: DEFAULT_LOCATION.longitude,
    radiusMiles: 30,
    limit: 50,
  });

  if (DATABASE_ENABLED) {
    const db_ = db!;
    const [prefs] = await db_.select().from(preferences).where(eq(preferences.userId, userId));

    const recentEntries = await db_
      .select({ entry: journalEntries, restaurant: restaurants, visit: visits, rating: ratings })
      .from(journalEntries)
      .leftJoin(restaurants, eq(journalEntries.restaurantId, restaurants.id))
      .leftJoin(visits, eq(journalEntries.visitId, visits.id))
      .leftJoin(ratings, eq(ratings.visitId, visits.id))
      .where(eq(journalEntries.userId, userId))
      .orderBy(desc(journalEntries.createdAt))
      .limit(10);

    const spaces = await db_.select().from(sharedSpaceMembers).where(eq(sharedSpaceMembers.userId, userId));
    let wishlistNames: string[] = [];
    if (spaces[0]) {
      const rows = await db_
        .select({ name: restaurants.name })
        .from(wishlists)
        .leftJoin(restaurants, eq(wishlists.restaurantId, restaurants.id))
        .where(eq(wishlists.sharedSpaceId, spaces[0].sharedSpaceId))
        .limit(20);
      wishlistNames = rows.map((r) => r.name).filter((n): n is string => Boolean(n));
    }

    context = {
      favoriteCuisines: prefs?.favoriteCuisines ?? undefined,
      dislikedCuisines: prefs?.dislikedCuisines ?? undefined,
      budgetLevel: prefs?.budgetLevel ?? undefined,
      maxTravelMiles: prefs?.maxTravelMiles ?? undefined,
      recentVisits: recentEntries
        .filter((e) => e.restaurant)
        .map((e) => ({
          restaurantName: e.restaurant!.name,
          cuisines: e.restaurant!.cuisines,
          overallRating: e.rating?.overall ?? null,
        })),
      wishlistRestaurantNames: wishlistNames,
      availableRestaurants: nearby.map((r) => r.name),
    };
  } else {
    context = { availableRestaurants: nearby.map((r) => r.name) };
  }

  try {
    const rawReply = await askYuu(messages, context);
    const { reply, card } = await buildAssistantResponse(rawReply);
    return NextResponse.json({ reply, card, configured: true });
  } catch (err) {
    return NextResponse.json(
      { reply: err instanceof Error ? err.message : "YUU couldn't respond right now.", card: null, configured: true },
      { status: 502 }
    );
  }
}
