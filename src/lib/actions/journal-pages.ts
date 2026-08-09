"use server";

import { getDb, DATABASE_ENABLED, journalPages } from "@/db";
import { eq, and } from "drizzle-orm";
import { getCurrentUserId } from "@/lib/auth";
import { id } from "@/lib/id";
import { revalidatePath } from "next/cache";
import type { BoardElement } from "@/types/photo-journal";

export async function createJournalPage(template: string): Promise<string> {
  if (!DATABASE_ENABLED) {
    throw new Error("Connect a database (DATABASE_URL) to create a photo journal board.");
  }
  const db = getDb();
  const userId = await getCurrentUserId();

  const pageId = id("jpg");
  await db.insert(journalPages).values({
    id: pageId,
    userId,
    title: template,
    template,
    elements: [],
  });

  revalidatePath("/photo-journal");
  return pageId;
}

export async function updateJournalPage(pageId: string, title: string, elements: BoardElement[]): Promise<void> {
  if (!DATABASE_ENABLED) {
    throw new Error("Connect a database (DATABASE_URL) to save this board.");
  }
  const db = getDb();
  const userId = await getCurrentUserId();

  const coverPhotoUrl = elements.find((e) => e.type === "photo")?.photoUrl ?? null;

  await db
    .update(journalPages)
    .set({ title, elements, coverPhotoUrl, updatedAt: new Date() })
    .where(and(eq(journalPages.id, pageId), eq(journalPages.userId, userId)));

  revalidatePath("/photo-journal");
  revalidatePath(`/photo-journal/${pageId}`);
}

export async function deleteJournalPage(pageId: string): Promise<void> {
  if (!DATABASE_ENABLED) {
    throw new Error("Connect a database (DATABASE_URL) to delete this board.");
  }
  const db = getDb();
  const userId = await getCurrentUserId();
  await db.delete(journalPages).where(and(eq(journalPages.id, pageId), eq(journalPages.userId, userId)));
  revalidatePath("/photo-journal");
}
