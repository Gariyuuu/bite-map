import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest, type NextFetchEvent } from "next/server";

// Next.js 16 renamed `middleware.ts` to `proxy.ts` (functionality unchanged).
//
// Bite Map is browse-without-login by design (map/discover/journal/etc. all
// work for a signed-out visitor via the demo-user fallback in lib/auth.ts —
// see spec section 56/70). Clerk here only needs to populate auth context so
// getCurrentUserId() can tell signed-in apart from signed-out; it must NOT
// gate routes with auth.protect(), or every page (including API routes hit
// without a browser session, like curl or the dev-browser JWT handshake on a
// Clerk dev instance) 404s for anyone not already logged in.
const clerkConfigured = Boolean(
  process.env.CLERK_SECRET_KEY && process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
);

const withClerk = clerkMiddleware();

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
