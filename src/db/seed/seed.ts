/**
 * Populates Neon with the full mock dataset plus a demo "you + partner"
 * shared-space history, so the app looks alive immediately (spec section 65).
 * Run with: npm run db:seed  (requires DATABASE_URL + `npm run db:push` first)
 */
import { getDb } from "@/db";
import {
  restaurants,
  restaurantSources,
  restaurantDishes,
  users,
  profiles,
  preferences,
  visits,
  ratings,
  visitDishes,
  journalEntries,
  restaurantUserStatus,
  collections,
  collectionRestaurants,
  sharedSpaces,
  sharedSpaceMembers,
  wishlists,
  cuisineProgress,
} from "@/db/schema";
import { mockRestaurants, photoUrl } from "./data";
import { computeConsensus } from "@/lib/consensus";
import { id } from "@/lib/id";
import { syncAchievements } from "@/lib/achievements";

const DEMO_USER_ID = "demo_user_you";
const DEMO_PARTNER_ID = "demo_user_partner";

async function main() {
  const db = getDb();
  console.log(`Seeding ${mockRestaurants.length} restaurants...`);

  const restaurantIds: string[] = [];

  for (const seed of mockRestaurants) {
    const restaurantId = `rst_${seed.id}`;
    restaurantIds.push(restaurantId);

    const consensus = computeConsensus(
      seed.sources.map((s) => ({
        provider: s.provider,
        rating: s.rating,
        ratingScale: s.ratingScale,
        ratingCount: s.ratingCount,
      }))
    );

    await db
      .insert(restaurants)
      .values({
        id: restaurantId,
        name: seed.name,
        latitude: seed.latitude,
        longitude: seed.longitude,
        address: seed.address,
        city: seed.city,
        neighborhood: seed.neighborhood,
        zip: seed.zip,
        cuisines: seed.cuisines,
        priceLevel: seed.priceLevel,
        website: seed.website,
        phone: seed.phone,
        openingHours: seed.openingHours,
        heroPhotoUrl: photoUrl(seed.photoSeeds[0]),
        signatureDishes: seed.dishes.map((d) => d.name),
        consensusScore: consensus?.score,
        consensusConfidence: consensus?.confidence,
        popularityScore: seed.popularityScore,
        trendingScore: Math.max(0, Math.min(100, seed.popularityScore - 15 + Math.random() * 30)),
      })
      .onConflictDoNothing();

    for (const source of seed.sources) {
      await db
        .insert(restaurantSources)
        .values({
          id: id("src"),
          restaurantId,
          provider: source.provider,
          externalId: `${source.provider}:${seed.id}`,
          rating: source.rating,
          ratingScale: source.ratingScale,
          ratingCount: source.ratingCount,
          url: seed.website,
        })
        .onConflictDoNothing();
    }

    for (const dish of seed.dishes) {
      await db.insert(restaurantDishes).values({
        id: id("dsh"),
        restaurantId,
        name: dish.name,
        description: dish.description,
        estimatedPrice: dish.estimatedPrice,
        spiceLevel: dish.spiceLevel,
        dietaryTags: dish.dietaryTags ?? [],
        priority: dish.priority,
        whyOrder: dish.whyOrder,
      });
    }
  }

  console.log("Seeding demo users...");

  for (const [userId, name, cuisinesLiked] of [
    [DEMO_USER_ID, "You", ["Japanese", "Korean", "Vietnamese"]],
    [DEMO_PARTNER_ID, "Partner", ["Italian", "Korean", "Thai"]],
  ] as const) {
    await db
      .insert(users)
      .values({ id: userId, email: `${userId}@example.com`, displayName: name })
      .onConflictDoNothing();
    await db
      .insert(profiles)
      .values({ userId, homeCity: "Irvine", homeNeighborhood: "Irvine Spectrum", onboardingCompletedAt: new Date() })
      .onConflictDoNothing();
    await db
      .insert(preferences)
      .values({ userId, favoriteCuisines: [...cuisinesLiked], budgetLevel: "$$", maxTravelMiles: 15 })
      .onConflictDoNothing();
  }

  const sharedSpaceId = id("shr");
  await db.insert(sharedSpaces).values({
    id: sharedSpaceId,
    name: "Our Food Map",
    inviteCode: "BITEMAP-DEMO",
    createdByUserId: DEMO_USER_ID,
  });
  await db.insert(sharedSpaceMembers).values([
    { sharedSpaceId, userId: DEMO_USER_ID, role: "owner" },
    { sharedSpaceId, userId: DEMO_PARTNER_ID, role: "member" },
  ]);

  // Deterministic-ish split: first third solo "you", next third solo partner,
  // next chunk "together", remainder unvisited (wishlist/untouched) so map
  // filters (visited/wishlist/unvisited) all have real data to show.
  const solo1 = restaurantIds.slice(0, 12);
  const solo2 = restaurantIds.slice(12, 20);
  const together = restaurantIds.slice(20, 34);
  const wishlist = restaurantIds.slice(34, 40);

  async function recordVisit(userId: string, restaurantId: string, companions: string[], daysAgo: number) {
    const visitId = id("vis");
    const visitedAt = new Date(Date.now() - daysAgo * 86_400_000);
    await db.insert(visits).values({
      id: visitId,
      userId,
      restaurantId,
      sharedSpaceId: companions.length ? sharedSpaceId : undefined,
      visitedAt,
      mealType: "dinner",
      companions,
      costTotal: 25 + Math.round(Math.random() * 60),
      wouldReturn: Math.random() > 0.15,
    });
    const overall = Math.round((6 + Math.random() * 4) * 10) / 10;
    await db.insert(ratings).values({
      id: id("rat"),
      visitId,
      overall,
      food: overall,
      value: Math.round((5 + Math.random() * 5) * 10) / 10,
      atmosphere: Math.round((5 + Math.random() * 5) * 10) / 10,
      service: Math.round((5 + Math.random() * 5) * 10) / 10,
    });
    const restaurant = mockRestaurants.find((r) => `rst_${r.id}` === restaurantId);
    if (restaurant?.dishes.length) {
      const dish = restaurant.dishes[0];
      await db.insert(visitDishes).values({
        id: id("vdh"),
        visitId,
        dishName: dish.name,
        rating: Math.round((6 + Math.random() * 4) * 10) / 10,
      });
    }
    await db.insert(journalEntries).values({
      id: id("jnl"),
      userId,
      visitId,
      restaurantId,
      title: restaurant?.name,
      body: companions.length
        ? `Came back to ${restaurant?.name} with ${companions.join(", ")}. Would${
            Math.random() > 0.15 ? "" : "n't"
          } return.`
        : `Tried ${restaurant?.name} — solid ${restaurant?.cuisines[0] ?? "food"} spot.`,
      mood: overall >= 8 ? "loved it" : "pretty good",
    });

    await db
      .insert(restaurantUserStatus)
      .values({
        userId,
        restaurantId,
        visitCount: 1,
        lastVisitedAt: visitedAt,
        wouldReturn: Math.random() > 0.15,
        isFavorite: overall >= 9,
      })
      .onConflictDoUpdate({
        target: [restaurantUserStatus.userId, restaurantUserStatus.restaurantId],
        set: { visitCount: 1, lastVisitedAt: visitedAt },
      });

    if (restaurant) {
      for (const cuisine of restaurant.cuisines) {
        await db
          .insert(cuisineProgress)
          .values({ userId, cuisine, visitedCount: 1, recommendedTotal: 20 })
          .onConflictDoUpdate({
            target: [cuisineProgress.userId, cuisineProgress.cuisine],
            set: { visitedCount: 1 },
          });
      }
    }
  }

  console.log("Seeding visits, ratings, and journal entries...");
  let dayOffset = 2;
  for (const rid of solo1) {
    await recordVisit(DEMO_USER_ID, rid, [], dayOffset);
    dayOffset += 5;
  }
  dayOffset = 3;
  for (const rid of solo2) {
    await recordVisit(DEMO_PARTNER_ID, rid, [], dayOffset);
    dayOffset += 6;
  }
  dayOffset = 1;
  for (const rid of together) {
    await recordVisit(DEMO_USER_ID, rid, ["Partner"], dayOffset);
    await recordVisit(DEMO_PARTNER_ID, rid, ["You"], dayOffset);
    dayOffset += 4;
  }

  console.log("Seeding wishlist + collections...");
  for (const rid of wishlist) {
    await db.insert(wishlists).values({
      id: id("wsh"),
      sharedSpaceId,
      restaurantId: rid,
      addedByUserId: Math.random() > 0.5 ? DEMO_USER_ID : DEMO_PARTNER_ID,
      votes: [DEMO_USER_ID, DEMO_PARTNER_ID],
    });
    await db
      .insert(restaurantUserStatus)
      .values({ userId: DEMO_USER_ID, restaurantId: rid, isWishlist: true })
      .onConflictDoUpdate({
        target: [restaurantUserStatus.userId, restaurantUserStatus.restaurantId],
        set: { isWishlist: true },
      });
  }

  const ramenCollection = id("col");
  await db.insert(collections).values({
    id: ramenCollection,
    userId: DEMO_USER_ID,
    name: "Ramen Tour",
    description: "Every ramen shop worth the wait.",
    type: "custom",
  });
  const ramenIds = mockRestaurants
    .filter((r) => r.cuisines.includes("Ramen"))
    .map((r) => `rst_${r.id}`);
  for (const rid of ramenIds) {
    await db.insert(collectionRestaurants).values({ collectionId: ramenCollection, restaurantId: rid }).onConflictDoNothing();
  }

  const dateNightCollection = id("col");
  await db.insert(collections).values({
    id: dateNightCollection,
    sharedSpaceId,
    name: "Date Night",
    description: "Our go-to list for a nice night out.",
    type: "custom",
  });
  const dateNightIds = mockRestaurants
    .filter((r) => r.cuisines.includes("Date Night"))
    .map((r) => `rst_${r.id}`);
  for (const rid of dateNightIds) {
    await db
      .insert(collectionRestaurants)
      .values({ collectionId: dateNightCollection, restaurantId: rid })
      .onConflictDoNothing();
  }

  console.log("Syncing achievements...");
  await syncAchievements(DEMO_USER_ID);
  await syncAchievements(DEMO_PARTNER_ID);

  console.log("Done. Demo users: demo_user_you, demo_user_partner (shared space: Our Food Map).");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
