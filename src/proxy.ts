import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest, type NextFetchEvent } from "next/server";

// Next.js 16 renamed `middleware.ts` to `proxy.ts` (functionality unchanged).
const isPublicRoute = createRouteMatcher(["/", "/sign-in(.*)", "/sign-up(.*)", "/api/webhooks(.*)"]);

const clerkConfigured = Boolean(
  process.env.CLERK_SECRET_KEY && process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
);

const withClerk = clerkMiddleware(async (clerkAuth, req) => {
  if (!isPublicRoute(req)) {
    await clerkAuth.protect();
  }
});

// Clerk isn't required to run the app (see lib/auth.ts demo-user fallback),
// so skip the middleware entirely rather than let it throw on missing keys.
export default function proxy(req: NextRequest, event: NextFetchEvent) {
  if (!clerkConfigured) return NextResponse.next();
  return withClerk(req, event);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
