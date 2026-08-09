import { getCurrentUserId } from "@/lib/auth";
import { getJournalEntries } from "@/lib/queries/journal";
import { JournalEntryCard } from "@/components/journal/journal-entry-card";
import { DATABASE_ENABLED } from "@/db";
import { Card } from "@/components/ui/card";

export default async function JournalPage() {
  const userId = await getCurrentUserId();
  const entries = await getJournalEntries(userId);

  const groups = new Map<string, typeof entries>();
  for (const entry of entries) {
    const date = new Date(entry.visit?.visitedAt ?? entry.createdAt);
    const key = date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    groups.set(key, [...(groups.get(key) ?? []), entry]);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4">
      <div className="space-y-1">
        <h1 className="font-serif text-3xl font-semibold tracking-tight">Food Journal</h1>
        <p className="text-sm text-muted-foreground">Every meal, memory, and note — in order.</p>
      </div>

      {!DATABASE_ENABLED && (
        <Card className="border-dashed p-4 text-sm text-muted-foreground">
          Connect DATABASE_URL to start logging visits — see .env.example. Once connected, run{" "}
          <code className="rounded bg-muted px-1">npm run db:seed</code> to preview a full demo journal.
        </Card>
      )}

      {DATABASE_ENABLED && entries.length === 0 && (
        <Card className="border-dashed p-6 text-center text-sm text-muted-foreground">
          No entries yet — mark a restaurant as visited from Discover or the Map to start your journal.
        </Card>
      )}

      {Array.from(groups.entries()).map(([month, monthEntries]) => (
        <section key={month} className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{month}</h2>
          <div className="space-y-3">
            {monthEntries.map((entry) => (
              <JournalEntryCard key={entry.id} entry={entry} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
