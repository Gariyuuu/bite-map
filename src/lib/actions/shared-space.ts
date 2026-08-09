"use server";

import { getDb, DATABASE_ENABLED, sharedSpaces, sharedSpaceMembers, wishlists, users, profiles, preferences } from "@/db";
import { eq } from "drizzle-orm";
import { getCurrentUserId } from "@/lib/auth";
import { id } from "@/lib/id";
import { revalidatePath } from "next/cache";

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars (0/O, 1/I)
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

async function ensureUser(userId: string) {
  const db = getDb();
  await db.insert(users).values({ id: userId, email: `${userId}@example.com` }).onConflictDoNothing();
  await db.insert(profiles).values({ userId }).onConflictDoNothing();
  await db.insert(preferences).values({ userId }).onConflictDoNothing();
}

export async function createSharedSpace(name: string): Promise<string> {
  if (!DATABASE_ENABLED) throw new Error("Connect a database (DATABASE_URL) to create a shared food map.");
  const db = getDb();
  const userId = await getCurrentUserId();
  await ensureUser(userId);

  const existing = await db.select().from(sharedSpaceMembers).where(eq(sharedSpaceMembers.userId, userId));
  if (existing.length > 0) throw new Error("You're already in a shared food map.");

  const spaceId = id("shr");
  await db.insert(sharedSpaces).values({ id: spaceId, name: name || "Our Food Map", inviteCode: generateInviteCode(), createdByUserId: userId });
  await db.insert(sharedSpaceMembers).values({ sharedSpaceId: spaceId, userId, role: "owner" });

  revalidatePath("/shared");
  return spaceId;
}

export async function joinSharedSpace(inviteCode: string): Promise<void> {
  if (!DATABASE_ENABLED) throw new Error("Connect a database (DATABASE_URL) to join a shared food map.");
  const db = getDb();
  const userId = await getCurrentUserId();
  await ensureUser(userId);

  const [space] = await db.select().from(sharedSpaces).where(eq(sharedSpaces.inviteCode, inviteCode.trim().toUpperCase()));
  if (!space) throw new Error("Invite code not found — double check it with your partner.");

  const existing = await db.select().from(sharedSpaceMembers).where(eq(sharedSpaceMembers.userId, userId));
  if (existing.length > 0) throw new Error("You're already in a shared food map.");

  await db.insert(sharedSpaceMembers).values({ sharedSpaceId: space.id, userId, role: "member" }).onConflictDoNothing();
  revalidatePath("/shared");
}

export async function addToSharedWishlist(sharedSpaceId: string, restaurantId: string, comment?: string): Promise<void> {
  if (!DATABASE_ENABLED) throw new Error("Connect a database (DATABASE_URL) to save to the wishlist.");
  const db = getDb();
  const userId = await getCurrentUserId();
  await ensureUser(userId);

  await db.insert(wishlists).values({ id: id("wsh"), sharedSpaceId, restaurantId, addedByUserId: userId, votes: [userId], comment });
  revalidatePath("/shared");
}

export async function removeFromSharedWishlist(wishlistId: string): Promise<void> {
  if (!DATABASE_ENABLED) throw new Error("Connect a database (DATABASE_URL) to update the wishlist.");
  const db = getDb();
  await db.delete(wishlists).where(eq(wishlists.id, wishlistId));
  revalidatePath("/shared");
}

export async function toggleWishlistVote(wishlistId: string): Promise<void> {
  if (!DATABASE_ENABLED) throw new Error("Connect a database (DATABASE_URL) to vote.");
  const db = getDb();
  const userId = await getCurrentUserId();

  const [row] = await db.select().from(wishlists).where(eq(wishlists.id, wishlistId));
  if (!row) return;
  const votes = row.votes ?? [];
  const nextVotes = votes.includes(userId) ? votes.filter((v) => v !== userId) : [...votes, userId];

  await db.update(wishlists).set({ votes: nextVotes }).where(eq(wishlists.id, wishlistId));
  revalidatePath("/shared");
}
