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

export * from "./schema";
