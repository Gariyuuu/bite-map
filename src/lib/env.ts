/**
 * Centralized "is this integration configured?" checks. The whole app is
 * designed to run with zero keys set (mock data, demo user, static map
 * fallback) and upgrade automatically as each var is added — see .env.example
 * and section 56/70 of the product spec. Never import server-only secrets
 * here; only presence checks that are safe to read from client components.
 */
export const CLERK_ENABLED = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
export const MAPBOX_ENABLED = Boolean(process.env.NEXT_PUBLIC_MAPBOX_TOKEN);
export const UPLOADTHING_ENABLED = Boolean(process.env.NEXT_PUBLIC_UPLOADTHING_APP_ID);
