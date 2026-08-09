import Link from "next/link";
import { Sparkles, Map as MapIcon, Heart, BookHeart } from "lucide-react";
import { getCurrentUserId, getCurrentUserProfile } from "@/lib/auth";
import { getNearbyRestaurants } from "@/lib/queries/restaurants";
import { getJournalEntries } from "@/lib/queries/journal";
import { getProfileStats } from "@/lib/queries/stats";
import { DEFAULT_LOCATION } from "@/lib/neighborhoods";
import { DATABASE_ENABLED } from "@/db";
import { SectionRow } from "@/components/restaurants/section-row";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IntroSplash } from "@/components/shared/intro-splash";

export default async function DashboardPage() {
  const userId = await getCurrentUserId();
  const [profile, nearby, entries, stats] = await Promise.all([
    getCurrentUserProfile(),
    getNearbyRestaurants({
      latitude: DEFAULT_LOCATION.latitude,
      longitude: DEFAULT_LOCATION.longitude,
      radiusMiles: 8,
      userId,
      limit: 12,
    }),
    getJournalEntries(userId),
    getProfileStats(userId),
  ]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const recentEntry = entries[0];
  const trending = [...nearby].sort((a, b) => (b.trendingScore ?? 0) - (a.trendingScore ?? 0)).slice(0, 6);

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-4">
      <IntroSplash />
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          {greeting}
          {profile?.displayName ? `, ${profile.displayName}` : ""}.
        </h1>
        <p className="text-lg text-muted-foreground">Where are we eating next?</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold">{stats.restaurantsVisited}</p>
          <p className="text-xs text-muted-foreground">Visited</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold">{stats.cuisinesTried}</p>
          <p className="text-xs text-muted-foreground">Cuisines</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold">{stats.cities}</p>
          <p className="text-xs text-muted-foreground">Cities</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold">{stats.averageRating ?? "—"}</p>
          <p className="text-xs text-muted-foreground">Avg Rating</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Link href="/ai-guide">
          <Card className="flex h-full flex-col justify-between gap-2 p-4 transition-shadow hover:shadow-md">
            <Sparkles className="size-5 text-accent" />
            <div>
              <p className="font-medium">Tonight&apos;s YUU Pick</p>
              <p className="text-xs text-muted-foreground">Ask YUU where to eat tonight.</p>
            </div>
          </Card>
        </Link>
        <Link href="/map">
          <Card className="flex h-full flex-col justify-between gap-2 p-4 transition-shadow hover:shadow-md">
            <MapIcon className="size-5 text-accent" />
            <div>
              <p className="font-medium">Explore the Map</p>
              <p className="text-xs text-muted-foreground">See everywhere you&apos;ve been and haven&apos;t.</p>
            </div>
          </Card>
        </Link>
        <Link href="/shared">
          <Card className="flex h-full flex-col justify-between gap-2 p-4 transition-shadow hover:shadow-md">
            <Heart className="size-5 text-accent" />
            <div>
              <p className="font-medium">Our Food Map</p>
              <p className="text-xs text-muted-foreground">Shared wishlist and stats with your partner.</p>
            </div>
          </Card>
        </Link>
      </div>

      {!DATABASE_ENABLED && (
        <Card className="border-dashed p-4 text-sm text-muted-foreground">
          You&apos;re running Bite Map with mock data only. Add DATABASE_URL to unlock saved visits, journals, and
          collections — see .env.example.
        </Card>
      )}

      {recentEntry && (
        <Link href="/journal">
          <Card className="flex items-center gap-2 p-4 transition-shadow hover:shadow-md">
            <BookHeart className="size-5 shrink-0 text-[var(--journal-accent)]" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Recent meal</p>
              <p className="truncate font-medium">{recentEntry.restaurant?.name ?? recentEntry.title}</p>
            </div>
          </Card>
        </Link>
      )}

      <SectionRow title="Trending Near You" restaurants={trending} />

      <div className="flex justify-center pt-2">
        <Button render={<Link href="/discover" />} nativeButton={false} variant="outline">
          See everything nearby
        </Button>
      </div>
    </div>
  );
}
