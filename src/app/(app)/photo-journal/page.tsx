import Image from "next/image";
import Link from "next/link";
import { getCurrentUserId } from "@/lib/auth";
import { getJournalEntries } from "@/lib/queries/journal";
import { getJournalPages } from "@/lib/queries/journal-pages";
import { Card } from "@/components/ui/card";
import { DATABASE_ENABLED } from "@/db";
import { TemplateGallery } from "@/components/photo-journal/template-gallery";

export default async function PhotoJournalPage() {
  const userId = await getCurrentUserId();
  const [entries, boards] = await Promise.all([getJournalEntries(userId), getJournalPages(userId)]);
  const withPhotos = entries.filter((e) => e.restaurant?.heroPhotoUrl);

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-4">
      <div className="space-y-1">
        <h1 className="font-serif text-3xl font-semibold tracking-tight">Photo Journal</h1>
        <p className="text-sm text-muted-foreground">A scrapbook of everywhere you&apos;ve eaten.</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground">Start a board</h2>
        <TemplateGallery />
      </section>

      {boards.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">Your boards</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {boards.map((b) => (
              <Link key={b.id} href={`/photo-journal/${b.id}`}>
                <Card className="overflow-hidden py-0 gap-0 transition-shadow hover:shadow-md">
                  <div className="relative h-24 w-full bg-muted">
                    {b.coverPhotoUrl && <Image src={b.coverPhotoUrl} alt={b.title ?? "Board"} fill className="object-cover" />}
                  </div>
                  <div className="p-2">
                    <p className="truncate text-xs font-medium">{b.title ?? "Untitled board"}</p>
                    <p className="text-[11px] text-muted-foreground">{b.template}</p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

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
