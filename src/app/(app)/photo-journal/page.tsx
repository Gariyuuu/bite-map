import Image from "next/image";
import { getCurrentUserId } from "@/lib/auth";
import { getJournalEntries } from "@/lib/queries/journal";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DATABASE_ENABLED } from "@/db";

const TEMPLATES = [
  "Date Night",
  "Food Crawl",
  "Weekend Eats",
  "Ramen Tour",
  "Café Tour",
  "Dessert Day",
  "Birthday Dinner",
  "Michelin Night",
  "Asian Food Tour",
  "Month in Food",
  "Year in Food",
];

export default async function PhotoJournalPage() {
  const userId = await getCurrentUserId();
  const entries = await getJournalEntries(userId);
  const withPhotos = entries.filter((e) => e.restaurant?.heroPhotoUrl);

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-4">
      <div className="space-y-1">
        <h1 className="font-serif text-3xl font-semibold tracking-tight">Photo Journal</h1>
        <p className="text-sm text-muted-foreground">A scrapbook of everywhere you&apos;ve eaten.</p>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground">Start a board</h2>
          <Badge variant="outline">Drag-and-drop editor — Phase 6</Badge>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {TEMPLATES.map((t) => (
            <Card
              key={t}
              className="flex h-28 w-40 shrink-0 cursor-not-allowed select-none flex-col items-center justify-center gap-1 border-dashed p-3 text-center opacity-70"
            >
              <span className="text-sm font-medium">{t}</span>
              <span className="text-[11px] text-muted-foreground">Coming soon</span>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground">Memory Map</h2>
        {!DATABASE_ENABLED && (
          <Card className="border-dashed p-4 text-sm text-muted-foreground">
            Connect a database and log a few visits to fill this scrapbook with real memories.
          </Card>
        )}
        {DATABASE_ENABLED && withPhotos.length === 0 && (
          <Card className="border-dashed p-6 text-center text-sm text-muted-foreground">
            No food photos yet — every visit you log adds a memory here.
          </Card>
        )}
        <div className="columns-2 gap-3 sm:columns-3 md:columns-4 [&>*]:mb-3">
          {withPhotos.map((entry) => (
            <div key={entry.id} className="break-inside-avoid overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <div className="relative aspect-square w-full">
                <Image src={entry.restaurant!.heroPhotoUrl!} alt={entry.restaurant!.name} fill className="object-cover" />
              </div>
              <div className="p-2">
                <p className="truncate text-xs font-medium">{entry.restaurant!.name}</p>
                <p className="text-[11px] text-muted-foreground">
                  {new Date(entry.visit?.visitedAt ?? entry.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
