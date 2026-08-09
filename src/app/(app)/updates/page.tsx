const PATCH_NOTES = [
  {
    version: "v0.1.0",
    title: "Initial Food Map",
    date: "2026-08-08",
    notes: [
      "Provider-agnostic restaurant data layer (Google, Yelp, Foursquare, OSM, mock) with entity resolution",
      "BiteMap Consensus Score with Bayesian shrinkage across platforms",
      "Interactive Map with Standard/Dark/Satellite/Minimal/FRIDAY themes and status-colored markers",
      "Discover feed with trending, highly-rated, and haven't-tried sections",
      "Restaurant profiles with What to Order dish guides",
      "Visited / Wishlist / Favorite quick actions + detailed visit logging",
      "Food Journal and Photo Journal (scrapbook view)",
      "Collections (custom + shared)",
      "YUU AI food concierge abstraction",
      "Full Drizzle schema for shared couple mode, gamification, and food dates — ready for future phases",
    ],
  },
];

export default function UpdatesPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Patch Notes</h1>
        <p className="text-sm text-muted-foreground">What&apos;s new in Bite Map.</p>
      </div>
      <div className="space-y-6">
        {PATCH_NOTES.map((release) => (
          <div key={release.version} className="rounded-2xl border border-border p-4">
            <div className="flex items-baseline justify-between">
              <h2 className="text-lg font-semibold">{release.version}</h2>
              <span className="text-xs text-muted-foreground">{release.date}</span>
            </div>
            <p className="mb-2 text-sm font-medium text-muted-foreground">{release.title}</p>
            <ul className="list-disc space-y-1 pl-5 text-sm">
              {release.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
