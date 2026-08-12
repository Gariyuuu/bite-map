import { db, DATABASE_ENABLED, sharedSpaces, sharedSpaceMembers, users, restaurantUserStatus, wishlists, restaurants, safeQuery } from "@/db";
import { eq, inArray } from "drizzle-orm";

export interface SharedSpaceMember {
  userId: string;
  name: string;
  role: "owner" | "member";
}

export interface SharedWishlistItem {
  id: string;
  restaurantId: string;
  name: string;
  heroPhotoUrl: string | null;
  cuisines: string[];
  priceLevel: string | null;
  addedByName: string | null;
  votes: string[];
}

export interface SharedSpaceData {
  id: string;
  name: string;
  inviteCode: string;
  members: SharedSpaceMember[];
  stats: { you: number; partner: number; together: number };
  wishlist: SharedWishlistItem[];
}

export async function getUserSharedSpace(userId: string): Promise<SharedSpaceData | null> {
  if (!DATABASE_ENABLED) return null;
  return safeQuery(() => getUserSharedSpaceInner(userId), null);
}

async function getUserSharedSpaceInner(userId: string): Promise<SharedSpaceData | null> {
  const db_ = db!;

  const [membership] = await db_.select().from(sharedSpaceMembers).where(eq(sharedSpaceMembers.userId, userId));
  if (!membership) return null;

  const [space] = await db_.select().from(sharedSpaces).where(eq(sharedSpaces.id, membership.sharedSpaceId));
  if (!space) return null;

  const memberRows = await db_.select().from(sharedSpaceMembers).where(eq(sharedSpaceMembers.sharedSpaceId, space.id));
  const memberIds = memberRows.map((m) => m.userId);
  const userRows = await db_.select().from(users).where(inArray(users.id, memberIds));
  const nameById = new Map(userRows.map((u) => [u.id, u.displayName ?? u.email]));

  const members: SharedSpaceMember[] = memberRows.map((m) => ({
    userId: m.userId,
    name: nameById.get(m.userId) ?? "Member",
    role: m.role,
  }));

  // Stats assume the common couple case (2 members); with more members "partner" becomes "everyone else".
  const statusRows = await db_
    .select()
    .from(restaurantUserStatus)
    .where(inArray(restaurantUserStatus.userId, memberIds));

  const visitedByUser = new Map<string, Set<string>>();
  for (const row of statusRows) {
    if (row.visitCount <= 0) continue;
    if (!visitedByUser.has(row.userId)) visitedByUser.set(row.userId, new Set());
    visitedByUser.get(row.userId)!.add(row.restaurantId);
  }

  const mySet = visitedByUser.get(userId) ?? new Set<string>();
  const otherIds = memberIds.filter((id) => id !== userId);
  const otherSet = new Set<string>();
  for (const id of otherIds) {
    for (const r of visitedByUser.get(id) ?? []) otherSet.add(r);
  }

  let together = 0;
  for (const r of mySet) if (otherSet.has(r)) together += 1;
  const you = mySet.size - together;
  const partner = otherSet.size - together;

  const wishlistRows = await db_
    .select({ wishlist: wishlists, restaurant: restaurants })
    .from(wishlists)
    .leftJoin(restaurants, eq(wishlists.restaurantId, restaurants.id))
    .where(eq(wishlists.sharedSpaceId, space.id));

  const wishlist: SharedWishlistItem[] = wishlistRows
    .filter((r) => r.restaurant !== null)
    .map((r) => ({
      id: r.wishlist.id,
      restaurantId: r.restaurant!.id,
      name: r.restaurant!.name,
      heroPhotoUrl: r.restaurant!.heroPhotoUrl,
      cuisines: r.restaurant!.cuisines,
      priceLevel: r.restaurant!.priceLevel,
      addedByName: r.wishlist.addedByUserId ? (nameById.get(r.wishlist.addedByUserId) ?? null) : null,
      votes: r.wishlist.votes ?? [],
    }));

  return { id: space.id, name: space.name, inviteCode: space.inviteCode, members, stats: { you, partner, together }, wishlist };
}
