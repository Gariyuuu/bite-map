import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import type { JournalEntryData } from "@/lib/queries/journal";

function StarRow({ rating }: { rating: number | null }) {
  if (rating == null) return null;
  const filled = Math.round(rating / 2);
  return (
    <div className="flex gap-0.5 text-amber-500">
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} className={i < filled ? "size-3.5 fill-current" : "size-3.5 text-muted-foreground/30"} />
      ))}
    </div>
  );
}

export function JournalEntryCard({ entry }: { entry: JournalEntryData }) {
  const date = new Date(entry.visit?.visitedAt ?? entry.createdAt);

  return (
    <div className="flex gap-4 rounded-3xl border border-[var(--journal-accent)]/20 bg-card p-4 shadow-sm">
      <div className="relative size-20 shrink-0 overflow-hidden rounded-2xl bg-muted sm:size-24">
        {entry.restaurant?.heroPhotoUrl && (
          <Image src={entry.restaurant.heroPhotoUrl} alt={entry.restaurant.name} fill className="object-cover" />
        )}
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--journal-accent)]">
          {date.toLocaleDateString("en-US", { month: "long", day: "numeric" })}
        </p>
        {entry.restaurant ? (
          <Link href={`/restaurant/${encodeURIComponent(entry.restaurant.id)}`} className="font-serif text-lg font-semibold hover:underline">
            {entry.restaurant.name}
          </Link>
        ) : (
          <p className="font-serif text-lg font-semibold">{entry.title}</p>
        )}
        <StarRow rating={entry.overallRating} />
        {entry.visit?.companions && entry.visit.companions.length > 0 && (
          <p className="text-xs italic text-muted-foreground">With {entry.visit.companions.join(", ")}</p>
        )}
        {entry.body && <p className="text-sm text-foreground/80">{entry.body}</p>}
        {entry.visit?.costTotal != null && (
          <p className="text-xs text-muted-foreground">Total: ${entry.visit.costTotal.toFixed(0)}</p>
        )}
      </div>
    </div>
  );
}
