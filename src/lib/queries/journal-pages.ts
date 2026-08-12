import { db, DATABASE_ENABLED, journalPages, safeQuery } from "@/db";
import { eq, desc } from "drizzle-orm";
import type { BoardElement } from "@/types/photo-journal";

export interface JournalPageSummary {
  id: string;
  title: string | null;
  template: string | null;
  coverPhotoUrl: string | null;
  updatedAt: Date;
}

export async function getJournalPages(userId: string): Promise<JournalPageSummary[]> {
  if (!DATABASE_ENABLED) return [];
  return safeQuery(async () => {
    const rows = await db!
      .select()
      .from(journalPages)
      .where(eq(journalPages.userId, userId))
      .orderBy(desc(journalPages.updatedAt));

    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      template: r.template,
      coverPhotoUrl: r.coverPhotoUrl,
      updatedAt: r.updatedAt,
    }));
  }, []);
}

export interface JournalPageDetail {
  id: string;
  userId: string;
  title: string | null;
  template: string | null;
  elements: BoardElement[];
}

export async function getJournalPageById(id: string): Promise<JournalPageDetail | null> {
  if (!DATABASE_ENABLED) return null;
  return safeQuery(async () => {
    const [row] = await db!.select().from(journalPages).where(eq(journalPages.id, id));
    if (!row) return null;
    return {
      id: row.id,
      userId: row.userId,
      title: row.title,
      template: row.template,
      elements: (row.elements as BoardElement[] | null) ?? [],
    };
  }, null);
}
