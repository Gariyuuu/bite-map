import Link from "next/link";
import { getCurrentUserId, getCurrentUserProfile } from "@/lib/auth";
import { getProfileStats } from "@/lib/queries/stats";
import { getAchievementStatus } from "@/lib/achievements";
import { db, DATABASE_ENABLED, cuisineProgress } from "@/db";
import { eq } from "drizzle-orm";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const STAT_LABELS = [
  ["restaurantsVisited", "Restaurants Visited"],
  ["cities", "Cities"],
  ["cuisinesTried", "Cuisines"],
  ["averageRating", "Avg Rating"],
] as const;

export default async function ProfilePage() {
  const userId = await getCurrentUserId();
  const [profile, stats, achievementStatus] = await Promise.all([
    getCurrentUserProfile(),
    getProfileStats(userId),
    getAchievementStatus(userId),
  ]);
  const cuisines = DATABASE_ENABLED ? await db!.select().from(cuisineProgress).where(eq(cuisineProgress.userId, userId)) : [];
  const unlockedCount = achievementStatus.filter((a) => a.unlockedAt).length;

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4">
      <div className="flex items-center gap-4">
        <Avatar className="size-16">
          {profile?.imageUrl && <AvatarImage src={profile.imageUrl} alt={profile.displayName ?? ""} />}
          <AvatarFallback>{(profile?.displayName ?? "?").slice(0, 1)}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-xl font-semibold">{profile?.displayName ?? "Foodie"}</h1>
          <p className="text-sm text-muted-foreground">{profile?.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {STAT_LABELS.map(([key, label]) => (
          <Card key={key} className="p-4 text-center">
            <p className="text-2xl font-bold">{stats[key] ?? "—"}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </Card>
        ))}
      </div>

      {(stats.favoriteCuisine || stats.favoriteRestaurant) && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {stats.favoriteCuisine && (
            <Card className="p-4">
              <p className="text-xs text-muted-foreground">Favorite Cuisine</p>
              <p className="font-semibold">{stats.favoriteCuisine}</p>
            </Card>
          )}
          {stats.favoriteRestaurant && (
            <Card className="p-4">
              <p className="text-xs text-muted-foreground">Favorite Restaurant</p>
              <p className="font-semibold">{stats.favoriteRestaurant}</p>
            </Card>
          )}
        </div>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground">Cuisine Passport</h2>
        {cuisines.length === 0 && (
          <Card className="border-dashed p-4 text-sm text-muted-foreground">
            Log a few visits to start filling in your cuisine passport.
          </Card>
        )}
        <div className="space-y-2">
          {cuisines.map((c) => {
            const pct = c.recommendedTotal > 0 ? Math.min(100, Math.round((c.visitedCount / c.recommendedTotal) * 100)) : 0;
            return (
              <div key={c.cuisine} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium">{c.cuisine}</span>
                  <span className="text-muted-foreground">
                    {c.visitedCount}/{c.recommendedTotal} · {pct}%
                  </span>
                </div>
                <Progress value={pct} />
              </div>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground">Achievements</h2>
          <span className="text-xs text-muted-foreground">
            {unlockedCount}/{achievementStatus.length} unlocked
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {achievementStatus.map((a) => (
            <Card
              key={a.key}
              className={cn("flex flex-col items-center gap-1 p-3 text-center", !a.unlockedAt && "opacity-40 grayscale")}
              title={a.description}
            >
              <span className="text-2xl">{a.emoji}</span>
              <p className="text-xs font-medium leading-tight">{a.label}</p>
            </Card>
          ))}
        </div>
      </section>

      <Card className="flex items-center justify-between bg-gradient-to-br from-rose-500 to-orange-400 p-4 text-white">
        <div>
          <p className="font-medium">🍽️ Year in Food {new Date().getFullYear()}</p>
          <p className="text-xs text-white/80">A Spotify-Wrapped-style look back at your year of eating.</p>
        </div>
        <Link href="/year-in-food" className="text-sm font-medium underline">
          View
        </Link>
      </Card>

      <Card className="flex items-center justify-between p-4">
        <div>
          <p className="font-medium">Shared Journey</p>
          <p className="text-xs text-muted-foreground">See restaurants you and your partner have explored together.</p>
        </div>
        <Link href="/map" className="text-sm font-medium text-accent underline">
          Open map
        </Link>
      </Card>
    </div>
  );
}
