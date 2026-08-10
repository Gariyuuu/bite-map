import { Utensils } from "lucide-react";

/**
 * Next.js route-loading boundary — automatically wraps every page inside the
 * (app) group in a Suspense fallback, so navigating to a page that fetches
 * data (restaurant profile, journal, dashboard, etc.) shows this instead of
 * a blank pause. Distinct from IntroSplash (one-time, first visit only) and
 * the Discover/Map skeletons (client-side refetch within an already-loaded
 * page) — this one covers server-side navigation between routes.
 */
export default function Loading() {
  return (
    <div className="flex h-[70vh] flex-col items-center justify-center gap-3">
      <div className="relative flex size-14 items-center justify-center rounded-2xl bg-accent/15">
        <Utensils className="size-6 animate-pulse text-accent" />
      </div>
      <div className="flex gap-1">
        <span className="size-1.5 animate-bounce rounded-full bg-accent [animation-delay:-0.3s]" />
        <span className="size-1.5 animate-bounce rounded-full bg-accent [animation-delay:-0.15s]" />
        <span className="size-1.5 animate-bounce rounded-full bg-accent" />
      </div>
    </div>
  );
}
