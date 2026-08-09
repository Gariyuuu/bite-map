import Image from "next/image";
import Link from "next/link";
import { getCurrentUserId } from "@/lib/auth";
import { getUserCollections } from "@/lib/queries/collections";
import { DATABASE_ENABLED } from "@/db";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const CURATED_EXAMPLES = [
  "Top 25 Around You",
  "Best Restaurants You Haven't Tried",
  "Top Japanese",
  "Top Korean",
  "Best Cheap Eats",
  "Best Date Spots",
  "Hidden Gems",
  "New Openings",
];

export default async function CollectionsPage() {
  const userId = await getCurrentUserId();
  const collections = await getUserCollections(userId);

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Collections</h1>
        <p className="text-sm text-muted-foreground">Your custom lists, plus curated picks generated for you.</p>
      </div>

      {!DATABASE_ENABLED && (
        <Card className="border-dashed p-4 text-sm text-muted-foreground">
          Connect DATABASE_URL and run <code className="rounded bg-muted px-1">npm run db:seed</code> to see the
          demo Ramen Tour and shared Date Night collections.
        </Card>
      )}

      {DATABASE_ENABLED && collections.length === 0 && (
        <Card className="border-dashed p-6 text-center text-sm text-muted-foreground">
          No collections yet — save restaurants into a new list from any restaurant page.
        </Card>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {collections.map((c) => (
          <Link key={c.id} href={`/collections/${c.id}`}>
            <Card className="overflow-hidden py-0 gap-0 transition-shadow hover:shadow-md">
              <div className="relative h-32 w-full bg-muted">
                {c.coverPhotoUrl && <Image src={c.coverPhotoUrl} alt={c.name} fill className="object-cover" />}
              </div>
              <div className="space-y-1 p-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{c.name}</h3>
                  {c.isShared && (
                    <Badge variant="secondary" className="text-[11px]">
                      Shared
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{c.restaurantCount} restaurants</p>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground">Curated for you</h2>
        <div className="flex flex-wrap gap-2">
          {CURATED_EXAMPLES.map((c) => (
            <Badge key={c} variant="outline" className="cursor-not-allowed px-3 py-1.5 text-xs opacity-70">
              {c}
            </Badge>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Auto-curated collections generate from your ratings, wishlist, and nearby data — wire-up tracked for a
          future update.
        </p>
      </section>
    </div>
  );
}
