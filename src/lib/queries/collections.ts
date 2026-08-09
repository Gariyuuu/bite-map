import { db, DATABASE_ENABLED, collections, collectionRestaurants, restaurants, sharedSpaceMembers } from "@/db";
import { eq, inArray, or } from "drizzle-orm";

export interface CollectionSummary {
  id: string;
  name: string;
  description: string | null;
  isShared: boolean;
  coverPhotoUrl: string | null;
  restaurantCount: number;
}

export async function getUserCollections(userId: string): Promise<CollectionSummary[]> {
  if (!DATABASE_ENABLED) return [];
  const db_ = db!;

  const spaces = await db_.select({ id: sharedSpaceMembers.sharedSpaceId }).from(sharedSpaceMembers).where(eq(sharedSpaceMembers.userId, userId));
  const spaceIds = spaces.map((s) => s.id);

  const rows = await db_
    .select()
    .from(collections)
    .where(spaceIds.length > 0 ? or(eq(collections.userId, userId), inArray(collections.sharedSpaceId, spaceIds)) : eq(collections.userId, userId));

  const summaries: CollectionSummary[] = [];
  for (const row of rows) {
    const linked = await db_
      .select({ restaurantId: collectionRestaurants.restaurantId, heroPhotoUrl: restaurants.heroPhotoUrl })
      .from(collectionRestaurants)
      .leftJoin(restaurants, eq(collectionRestaurants.restaurantId, restaurants.id))
      .where(eq(collectionRestaurants.collectionId, row.id));

    summaries.push({
      id: row.id,
      name: row.name,
      description: row.description,
      isShared: Boolean(row.sharedSpaceId),
      coverPhotoUrl: linked[0]?.heroPhotoUrl ?? null,
      restaurantCount: linked.length,
    });
  }

  return summaries;
}

export async function getCollectionWithRestaurants(collectionId: string) {
  if (!DATABASE_ENABLED) return null;
  const db_ = db!;

  const [collection] = await db_.select().from(collections).where(eq(collections.id, collectionId));
  if (!collection) return null;

  const rows = await db_
    .select({ restaurant: restaurants })
    .from(collectionRestaurants)
    .leftJoin(restaurants, eq(collectionRestaurants.restaurantId, restaurants.id))
    .where(eq(collectionRestaurants.collectionId, collectionId));

  return { collection, restaurants: rows.map((r) => r.restaurant).filter((r): r is NonNullable<typeof r> => r !== null) };
}
