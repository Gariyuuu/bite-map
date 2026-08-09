import { PatchTimeline } from "@/components/updates/patch-timeline";
import type { PatchRelease } from "@/components/updates/patch-timeline";

const PATCH_NOTES: PatchRelease[] = [
  {
    version: "v0.9.0",
    title: "Polish pass",
    date: "2026-08-09",
    tags: ["design"],
    notes: [
      "Real favicon, animated first-visit intro screen",
      "Visual theme picker — a scroll-snap wheel of live mini-mockups using each palette's real colors",
      "Redesigned patch log (this page)",
      "Expanded the mock restaurant dataset across many more OC/LA neighborhoods",
    ],
  },
  {
    version: "v0.8.0",
    title: "A real map",
    date: "2026-08-09",
    tags: ["feature", "fix"],
    notes: [
      "Replaced the abstract custom-projection map with real, navigable Leaflet tiles (OpenStreetMap/CartoDB/Esri — no API key)",
      "Restaurants now plot at their actual coordinates instead of a fake percentage projection",
      "Default theme switched from FRIDAY to Standard",
    ],
  },
  {
    version: "v0.7.0",
    title: "AI response cards",
    date: "2026-08-09",
    tags: ["feature", "fix"],
    notes: [
      "YUU replies render as structured restaurant cards (consensus score, must-order dishes) instead of plain text",
      "Cards are built from our own database, never from the model's own numbers",
      "Fixed a duplicate-dish data bug uncovered while verifying the card pipeline",
    ],
  },
  {
    version: "v0.6.0",
    title: "Our Food Map",
    date: "2026-08-09",
    tags: ["feature"],
    notes: [
      "Real create-or-join shared spaces with invite codes",
      "You / Together / Partner stats computed from actual visit overlap",
      "Shared wishlist with search-and-add, voting, and a \"what should we eat\" randomizer",
    ],
  },
  {
    version: "v0.5.0",
    title: "Year in Food + exports",
    date: "2026-08-09",
    tags: ["feature"],
    notes: [
      "Spotify-Wrapped-style annual recap built from real visit/rating data",
      "Photo Journal board export to PNG",
      "Year in Food export to a WebM flipbook video, rendered entirely client-side",
    ],
  },
  {
    version: "v0.4.0",
    title: "Photo Journal editor",
    date: "2026-08-09",
    tags: ["feature"],
    notes: [
      "Real drag-and-drop scrapbook board editor — photos, restaurant cards, captions, date stamps",
      "Elements pulled from actual visited-restaurant history",
    ],
  },
  {
    version: "v0.3.0",
    title: "Gamification",
    date: "2026-08-09",
    tags: ["feature"],
    notes: ["Achievement catalog synced after every visit-logging action", "Surfaced on the Profile page"],
  },
  {
    version: "v0.2.0",
    title: "Real database + auth",
    date: "2026-08-09",
    tags: ["infra", "fix"],
    notes: [
      "Neon Postgres and Clerk auto-provisioned via the Vercel Marketplace",
      "YUU integration corrected to match the real self-hosted API contract",
      "Fixed a proxy misconfiguration that blocked every route for signed-out visitors",
    ],
  },
  {
    version: "v0.1.0",
    title: "Initial Food Map",
    date: "2026-08-08",
    tags: ["feature"],
    notes: [
      "Provider-agnostic restaurant data layer (Google, Yelp, Foursquare, OSM, mock) with entity resolution",
      "BiteMap Consensus Score with Bayesian shrinkage across platforms",
      "Discover feed, restaurant profiles with What to Order dish guides",
      "Visited / Wishlist / Favorite tracking, Food Journal, Collections",
      "YUU AI food concierge abstraction",
      "Full Drizzle schema for shared couple mode, gamification, and food dates",
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
      <PatchTimeline releases={PATCH_NOTES} />
    </div>
  );
}
