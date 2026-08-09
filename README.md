# Bite Map

Your food exploration operating system — an interactive map of everywhere you've eaten (and haven't), a restaurant/food journal, a photo scrapbook, and an AI food concierge, built to be explored solo or with a partner.

Bite Map is deliberately **not** a generic restaurant finder. The three systems everything else orbits are:

1. **Interactive Food Map** — a real navigable map (Leaflet + free OpenStreetMap/CartoDB/Esri tiles, no API key) with status-colored markers, 5 themes, and neighborhood exploration progress
2. **Restaurant / Food Journal** — a warm, chronological record of what you ate, with whom, and what you thought
3. **Photo Journal** — a drag-and-drop scrapbook board (photos, restaurant cards, captions, date stamps) built from your real visit history

The core loop: **Discover → Visit → Check Off → Rate → Photograph → Journal → Remember → Discover Again.**

## Design principle: works with zero keys

Every integration is optional and additive. With no environment variables set at all, Bite Map still runs fully: a 52-restaurant hand-authored Orange County / LA dataset (Irvine, Costa Mesa, Newport Beach, Little Tokyo, Koreatown, Downtown LA, Little Saigon) powers the map and discovery feed, and a demo user lets you click around every screen. Add `DATABASE_URL` to persist visits, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`/`CLERK_SECRET_KEY` for real accounts, provider keys to replace mock data with live restaurant data, and `YUU_API_URL`/`YUU_API_KEY` to bring the AI concierge online — each upgrade is independent and requires no code changes. See `.env.example`.

## Architecture

```
/src
  /app                    Next.js App Router routes
    /(app)                Authenticated shell: map, discover, journal, photo-journal,
                           collections, ai-guide, profile, restaurant/[id], updates
    /api                  Route handlers (restaurants/nearby, ai-guide/chat, uploadthing)
    /sign-in, /sign-up     Clerk auth routes
  /components
    /map                  Map canvas, theme switcher, filters
    /restaurants           Cards, consensus badge, dish guide, quick actions
    /journal, /photo-journal, /ai, /layout, /shared
    /ui                    shadcn/ui primitives
  /providers               Restaurant data source adapters — google.ts, yelp.ts,
                            foursquare.ts, osm.ts, mock.ts — all implementing the same
                            RestaurantProvider interface. index.ts fans out to whichever
                            are configured and falls back to mock.
  /services
    yuu-ai.ts               YUU AI concierge abstraction (server-only)
  /lib
    consensus.ts            BiteMap Consensus Score (Bayesian shrinkage across platforms)
    entity-resolution.ts    Merges duplicate results across providers into one restaurant
    filters.ts, hours.ts, geo.ts, map-projection.ts, restaurant-status.ts
    /queries                DB-or-provider-fallback data access (restaurants, journal,
                             collections, stats)
    /actions                Server actions (toggleWishlist, logVisit, quickCheckIn, ...)
  /db
    schema.ts                Full Drizzle schema (see below)
    seed/                    Mock restaurant dataset + seed script
  /types                    NormalizedRestaurant (provider contract) and RestaurantCard
                             (UI contract) — the two shapes everything else builds on
```

### Provider abstraction

Every restaurant data source implements `RestaurantProvider` (`src/providers/types.ts`):

```ts
interface RestaurantProvider {
  id: ProviderId;
  isConfigured(): boolean;
  searchNearby(params): Promise<NormalizedRestaurant[]>;
  getById(externalId): Promise<NormalizedRestaurant | null>;
}
```

`searchAllProviders()` fans a nearby search out to every configured real provider (Google, Yelp, Foursquare, OSM) in parallel and falls back to the mock provider if none are configured. Results are then merged by `lib/entity-resolution.ts`, which matches records across providers by proximity + fuzzy name (no shared ID exists across Google/Yelp/Foursquare/OSM) so the same restaurant never shows up as duplicate pins.

### Consensus score

`lib/consensus.ts` implements the spec's Bayesian-shrinkage blend: each platform rating is normalized to a 0-100 scale, shrunk toward a neutral prior in proportion to how few reviews back it (so five 5-star reviews don't outrank three thousand 4.6-star reviews), then combined weighted by `log(1 + reviewCount)`. Confidence labels (`low`/`medium`/`high`/`very_high`) are derived from total review volume.

### Database

`src/db/schema.ts` is the full data model from the product spec — restaurants, restaurant_sources, restaurant_dishes, visits, ratings, visit_dishes, journal_entries, journal_pages, collections, wishlists, shared_spaces, food_dates, achievements, cuisine_progress, dish_progress, ai_conversations, preferences — even though the UI currently exercises Phases 1-5 of the build order below. This means adding the Phase 6-7 UI (photo journal canvas editor, gamification surfaces) is additive, not a schema migration.

Restaurants are canonical — a Google result and a Yelp result for the same physical restaurant resolve to one `restaurants` row with multiple `restaurant_sources` rows, never duplicate restaurants.

## Local setup

```bash
npm install
cp .env.example .env.local   # fill in whichever keys you have
npm run dev
```

The app is fully clickable at this point with mock data and a demo user.

### Add a database

Fastest path, if the project is linked to Vercel (`vercel link`): `vercel install neon` provisions a free Neon Postgres, connects it to the project, and writes `DATABASE_URL` straight into `.env.local` — no separate signup. Otherwise:

1. Create a [Neon](https://neon.tech) Postgres database, set `DATABASE_URL` in `.env.local`.
2. `npm run db:push` — pushes the Drizzle schema.
3. `npm run db:seed` — seeds the full 52-restaurant dataset plus a demo "you + partner" shared-space history (visits, ratings, journal entries, wishlist, collections), so every screen looks alive immediately.
4. `npm run db:studio` — inspect data in Drizzle Studio.

### Add real accounts

Fastest path: `vercel install clerk` (same one-command flow as Neon above) provisions a Clerk app and writes `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` into `.env.local` directly — it comes up in Clerk's dev/test mode, switch to production keys in the Clerk dashboard when ready to ship real accounts. Otherwise, create an app at [clerk.com](https://clerk.com) and set those two vars by hand. Until either is set, every write (visits, wishlist, etc.) uses the seeded `demo_user_you` account — see `src/lib/auth.ts`.

This deployment already has both wired up via the Vercel Marketplace.

### Add live restaurant data

Any of `GOOGLE_PLACES_API_KEY`, `YELP_API_KEY`, `FOURSQUARE_API_KEY` switch the Map/Discover data source from mock to live automatically — no code change. `ENABLE_OSM_PROVIDER=true` opts into the free OpenStreetMap/Overpass provider (off by default since it's a shared community resource with strict rate limits).

### YUU AI integration

`src/services/yuu-ai.ts` posts the conversation plus a system prompt built from the user's preferences, recent visits, and wishlist to `${YUU_API_URL}/v1/chat/completions` — the OpenAI-compatible wire format used by the self-hosted AI platform at `~/Projects/ai-platform` (api.gariyuuu.com). Set `YUU_API_URL` (base URL, no `/v1`) and `YUU_API_KEY` (a `gai_live_...` key — mint one with `docker compose exec api python -m admin create-key --name "bite-map"` from the ai-platform repo) to bring the AI Guide page online; until then it shows a "connect YUU" message instead of failing.

## Privacy

Location is entirely consent-based (spec section 3): the app never requests geolocation on load. The first time a location-dependent feature is used, `LocationConsentDialog` offers **Allow location**, **Enter location manually** (city/neighborhood picker), or **Not now** — declining still leaves the full app usable via a default location. Consent state and coordinates are stored client-side (`localStorage`) only; nothing is persisted server-side, and there is no background location tracking.

## API cost protection

- All provider fetches are wrapped in Next's `fetch` cache (`next: { revalidate }`) at 1-6 hour windows.
- The nearby-search API route (`/api/restaurants/nearby`) takes an explicit radius and result limit — no unbounded queries.
- The DB-backed path pre-filters with a lat/lng bounding box before the more expensive haversine sort, so a configured database never does a full table scan for a nearby search.
- OSM/Overpass — a shared free resource — is off by default (`ENABLE_OSM_PROVIDER=false`) to avoid hammering public infrastructure.
- No provider API key is ever sent to the client; all provider calls happen in server-only route handlers/queries.

## Deployment

Deploys to Vercel like any Next.js app: `vercel --prod`, with the env vars from `.env.example` set in the project settings. Run `npm run db:push && npm run db:seed` once against the production database if you want the demo data live.

## Build order / what's implemented

Phases 1-8 of the product spec's implementation order are built: auth, map, discovery, restaurant profiles, visited/wishlist/favorite, consensus scoring, dish guides, search/filtering, food journal, a real drag-and-drop photo journal board editor with PNG export, collections, the YUU concierge abstraction, gamification achievements, a Year in Food annual recap with WebM video export, and **Our Food Map** (`/shared`) — real create-or-join shared spaces (invite codes), you/together/partner visit-overlap stats computed from actual visit history, a shared wishlist with voting, and a "what should we eat" randomizer.

Not yet built, by design rather than oversight: onboarding flow, dish-level passport checklist (`dish_progress` has the schema, no UI), restaurant comparison tool, AI response cards (the AI Guide replies with plain text, not the spec's visual "Tonight's Pick" cards), and proximity-based quick check-in prompts. See `/updates` for patch notes as those land.
