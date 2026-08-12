import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL;

export const DATABASE_ENABLED = Boolean(databaseUrl);

/**
 * `db` is undefined when DATABASE_URL isn't configured yet. Callers that hit
 * the database must go through `getDb()` so the app fails with a clear error
 * instead of a cryptic driver crash — everything else (mock providers, static
 * pages) works with zero env vars per the "no half-configured app" rule.
 */
export const db = databaseUrl ? drizzle(neon(databaseUrl), { schema }) : undefined;

export function getDb() {
  if (!db) {
    throw new Error(
      "DATABASE_URL is not set. Add it to .env.local to enable persistence (see .env.example)."
    );
  }
  return db;
}

/**
 * Wraps a read query so a live Neon error (quota, connection blip, outage) degrades to a safe
 * empty default instead of throwing an uncaught error that crashes the page. Callers are
 * expected to have already checked `DATABASE_ENABLED` before calling this — it only guards
 * against query-time failures, not missing configuration. Never use this around a write
 * (insert/update/delete) — a failed write must still surface to the caller.
 */
export async function safeQuery<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    console.error("[db] query failed, falling back to empty result:", error);
    return fallback;
  }
}

export * from "./schema";
