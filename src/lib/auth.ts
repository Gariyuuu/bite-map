import { auth, currentUser } from "@clerk/nextjs/server";
import { CLERK_ENABLED } from "./env";

/**
 * When Clerk isn't configured, the app falls back to the seeded demo account
 * (see db/seed/seed.ts) instead of breaking — matches the "works before every
 * key is added" rule (spec section 56/70).
 */
export const DEMO_USER_ID = "demo_user_you";
export const DEMO_PARTNER_ID = "demo_user_partner";

export async function getCurrentUserId(): Promise<string> {
  if (!CLERK_ENABLED) return DEMO_USER_ID;
  const { userId } = await auth();
  return userId ?? DEMO_USER_ID;
}

export async function getCurrentUserProfile() {
  if (!CLERK_ENABLED) {
    return { id: DEMO_USER_ID, email: "demo_user_you@example.com", displayName: "You", imageUrl: null };
  }
  const user = await currentUser();
  if (!user) return null;
  return {
    id: user.id,
    email: user.primaryEmailAddress?.emailAddress ?? "",
    displayName: user.fullName ?? user.username ?? "Foodie",
    imageUrl: user.imageUrl,
  };
}
