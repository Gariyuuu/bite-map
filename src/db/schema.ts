import {
  pgTable,
  pgEnum,
  text,
  timestamp,
  doublePrecision,
  integer,
  boolean,
  jsonb,
  primaryKey,
  uniqueIndex,
  index,
  real,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const priceLevelEnum = pgEnum("price_level", ["$", "$$", "$$$", "$$$$"]);

export const sourceProviderEnum = pgEnum("source_provider", [
  "google",
  "yelp",
  "foursquare",
  "osm",
  "mock",
  "manual",
]);

export const dishPriorityEnum = pgEnum("dish_priority", [
  "must_try",
  "popular",
  "local_favorite",
  "staff_favorite",
  "underrated",
  "safe_pick",
  "adventurous",
  "dessert",
  "best_value",
]);

export const mealTypeEnum = pgEnum("meal_type", [
  "breakfast",
  "brunch",
  "lunch",
  "dinner",
  "dessert",
  "drinks",
  "snack",
]);

export const collectionTypeEnum = pgEnum("collection_type", ["custom", "curated"]);

export const sharedRoleEnum = pgEnum("shared_role", ["owner", "member"]);

export const foodDateStatusEnum = pgEnum("food_date_status", [
  "proposed",
  "planned",
  "completed",
  "cancelled",
]);

// ---------------------------------------------------------------------------
// Users / profiles / preferences
// ---------------------------------------------------------------------------

/** Mirrors the Clerk user; local row exists so every other table can FK a stable id. */
export const users = pgTable("users", {
  id: text("id").primaryKey(), // Clerk user id
  email: text("email").notNull(),
  displayName: text("display_name"),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const profiles = pgTable("profiles", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  homeCity: text("home_city"),
  homeNeighborhood: text("home_neighborhood"),
  homeLat: doublePrecision("home_lat"),
  homeLng: doublePrecision("home_lng"),
  onboardingCompletedAt: timestamp("onboarding_completed_at"),
  theme: text("theme").default("midnight"),
  mapTheme: text("map_theme").default("friday"),
});

export const preferences = pgTable("preferences", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  favoriteCuisines: jsonb("favorite_cuisines").$type<string[]>().default([]),
  dislikedCuisines: jsonb("disliked_cuisines").$type<string[]>().default([]),
  budgetLevel: priceLevelEnum("budget_level"),
  maxTravelMiles: integer("max_travel_miles").default(15),
  dietaryRestrictions: jsonb("dietary_restrictions").$type<string[]>().default([]),
  locationConsent: boolean("location_consent").default(false),
  locationConsentAt: timestamp("location_consent_at"),
});

// ---------------------------------------------------------------------------
// Restaurants (canonical entity — see /lib/entity-resolution.ts)
// ---------------------------------------------------------------------------

export const restaurants = pgTable(
  "restaurants",
  {
    id: text("id").primaryKey(), // internal canonical id (cuid)
    name: text("name").notNull(),
    latitude: doublePrecision("latitude").notNull(),
    longitude: doublePrecision("longitude").notNull(),
    address: text("address"),
    city: text("city"),
    neighborhood: text("neighborhood"),
    zip: text("zip"),
    cuisines: jsonb("cuisines").$type<string[]>().default([]).notNull(),
    priceLevel: priceLevelEnum("price_level"),
    website: text("website"),
    phone: text("phone"),
    openingHours: jsonb("opening_hours").$type<Record<string, string>>(),
    heroPhotoUrl: text("hero_photo_url"),
    signatureDishes: jsonb("signature_dishes").$type<string[]>().default([]),

    // Cached aggregate fields (recomputed by /lib/consensus.ts, /lib/trending.ts)
    consensusScore: real("consensus_score"),
    consensusConfidence: text("consensus_confidence"), // low | medium | high | very_high
    popularityScore: real("popularity_score"),
    trendingScore: real("trending_score"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [index("restaurants_geo_idx").on(t.latitude, t.longitude), index("restaurants_city_idx").on(t.city)]
);

/** One row per (restaurant, provider) — raw external data feeding entity resolution + consensus. */
export const restaurantSources = pgTable(
  "restaurant_sources",
  {
    id: text("id").primaryKey(),
    restaurantId: text("restaurant_id")
      .notNull()
      .references(() => restaurants.id, { onDelete: "cascade" }),
    provider: sourceProviderEnum("provider").notNull(),
    externalId: text("external_id").notNull(),
    rating: real("rating"), // raw platform rating, native scale
    ratingScale: real("rating_scale").default(5), // e.g. 5 for Google/Yelp, 100 for %-based sources
    ratingCount: integer("rating_count").default(0),
    url: text("url"),
    rawPayload: jsonb("raw_payload"),
    fetchedAt: timestamp("fetched_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("restaurant_sources_provider_external_idx").on(t.provider, t.externalId)]
);

export const restaurantDishes = pgTable("restaurant_dishes", {
  id: text("id").primaryKey(),
  restaurantId: text("restaurant_id")
    .notNull()
    .references(() => restaurants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  photoUrl: text("photo_url"),
  estimatedPrice: real("estimated_price"),
  spiceLevel: integer("spice_level"), // 0-3
  dietaryTags: jsonb("dietary_tags").$type<string[]>().default([]),
  priority: dishPriorityEnum("priority"),
  whyOrder: text("why_order"),
  popularityRank: integer("popularity_rank"),
});

export const restaurantPhotos = pgTable("restaurant_photos", {
  id: text("id").primaryKey(),
  restaurantId: text("restaurant_id")
    .notNull()
    .references(() => restaurants.id, { onDelete: "cascade" }),
  uploadedByUserId: text("uploaded_by_user_id").references(() => users.id, { onDelete: "set null" }),
  url: text("url").notNull(),
  isUserPhoto: boolean("is_user_photo").default(false).notNull(),
  visitId: text("visit_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// Per-user restaurant relationship: status + visits + ratings
// ---------------------------------------------------------------------------

/** Fast-lookup rollup of a user's relationship to a restaurant (drives map markers/filters). */
export const restaurantUserStatus = pgTable(
  "restaurant_user_status",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    restaurantId: text("restaurant_id")
      .notNull()
      .references(() => restaurants.id, { onDelete: "cascade" }),
    isWishlist: boolean("is_wishlist").default(false).notNull(),
    isFavorite: boolean("is_favorite").default(false).notNull(),
    isPlanned: boolean("is_planned").default(false).notNull(),
    visitCount: integer("visit_count").default(0).notNull(),
    lastVisitedAt: timestamp("last_visited_at"),
    wouldReturn: boolean("would_return"),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.restaurantId] })]
);

export const visits = pgTable("visits", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  restaurantId: text("restaurant_id")
    .notNull()
    .references(() => restaurants.id, { onDelete: "cascade" }),
  sharedSpaceId: text("shared_space_id"),
  visitedAt: timestamp("visited_at").defaultNow().notNull(),
  mealType: mealTypeEnum("meal_type"),
  companions: jsonb("companions").$type<string[]>().default([]),
  costTotal: real("cost_total"),
  notes: text("notes"),
  wouldReturn: boolean("would_return"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const visitDishes = pgTable("visit_dishes", {
  id: text("id").primaryKey(),
  visitId: text("visit_id")
    .notNull()
    .references(() => visits.id, { onDelete: "cascade" }),
  dishId: text("dish_id").references(() => restaurantDishes.id, { onDelete: "set null" }),
  dishName: text("dish_name").notNull(),
  rating: real("rating"), // 0-10
});

export const ratings = pgTable("ratings", {
  id: text("id").primaryKey(),
  visitId: text("visit_id")
    .notNull()
    .references(() => visits.id, { onDelete: "cascade" }),
  overall: real("overall"), // simple 1-10, always present if any rating given
  food: real("food"),
  value: real("value"),
  service: real("service"),
  atmosphere: real("atmosphere"),
  presentation: real("presentation"),
  wait: real("wait"),
  datePotential: real("date_potential"),
});

// ---------------------------------------------------------------------------
// Journal
// ---------------------------------------------------------------------------

export const journalEntries = pgTable("journal_entries", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  visitId: text("visit_id").references(() => visits.id, { onDelete: "cascade" }),
  restaurantId: text("restaurant_id").references(() => restaurants.id, { onDelete: "set null" }),
  title: text("title"),
  body: text("body"),
  mood: text("mood"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/** Free-form canvas page for the Photo Journal editor (Phase 6). Elements stored as JSON layout. */
export const journalPages = pgTable("journal_pages", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  sharedSpaceId: text("shared_space_id"),
  title: text("title"),
  template: text("template"),
  elements: jsonb("elements").$type<unknown[]>().default([]),
  coverPhotoUrl: text("cover_photo_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// Collections / wishlist
// ---------------------------------------------------------------------------

export const collections = pgTable("collections", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  sharedSpaceId: text("shared_space_id"),
  name: text("name").notNull(),
  description: text("description"),
  type: collectionTypeEnum("type").default("custom").notNull(),
  isSystemGenerated: boolean("is_system_generated").default(false).notNull(),
  coverPhotoUrl: text("cover_photo_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const collectionRestaurants = pgTable(
  "collection_restaurants",
  {
    collectionId: text("collection_id")
      .notNull()
      .references(() => collections.id, { onDelete: "cascade" }),
    restaurantId: text("restaurant_id")
      .notNull()
      .references(() => restaurants.id, { onDelete: "cascade" }),
    addedAt: timestamp("added_at").defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.collectionId, t.restaurantId] })]
);

export const wishlists = pgTable(
  "wishlists",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
    sharedSpaceId: text("shared_space_id"),
    restaurantId: text("restaurant_id")
      .notNull()
      .references(() => restaurants.id, { onDelete: "cascade" }),
    addedByUserId: text("added_by_user_id").references(() => users.id, { onDelete: "set null" }),
    votes: jsonb("votes").$type<string[]>().default([]), // user ids who upvoted
    comment: text("comment"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("wishlists_shared_space_idx").on(t.sharedSpaceId)]
);

// ---------------------------------------------------------------------------
// Shared (couple) mode — Phase 4
// ---------------------------------------------------------------------------

export const sharedSpaces = pgTable("shared_spaces", {
  id: text("id").primaryKey(),
  name: text("name").default("Our Food Map").notNull(),
  inviteCode: text("invite_code").notNull(),
  createdByUserId: text("created_by_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const sharedSpaceMembers = pgTable(
  "shared_space_members",
  {
    sharedSpaceId: text("shared_space_id")
      .notNull()
      .references(() => sharedSpaces.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: sharedRoleEnum("role").default("member").notNull(),
    joinedAt: timestamp("joined_at").defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.sharedSpaceId, t.userId] })]
);

export const foodDates = pgTable("food_dates", {
  id: text("id").primaryKey(),
  sharedSpaceId: text("shared_space_id")
    .notNull()
    .references(() => sharedSpaces.id, { onDelete: "cascade" }),
  restaurantId: text("restaurant_id").references(() => restaurants.id, { onDelete: "set null" }),
  status: foodDateStatusEnum("status").default("proposed").notNull(),
  scheduledFor: timestamp("scheduled_for"),
  budget: real("budget"),
  mood: text("mood"),
  itinerary: jsonb("itinerary").$type<unknown[]>().default([]), // food-crawl style stops
  createdByUserId: text("created_by_user_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// Gamification — Phase 7
// ---------------------------------------------------------------------------

export const achievements = pgTable(
  "achievements",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    key: text("key").notNull(), // e.g. "RAMEN_ROOKIE"
    unlockedAt: timestamp("unlocked_at").defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.key] })]
);

export const cuisineProgress = pgTable(
  "cuisine_progress",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    cuisine: text("cuisine").notNull(),
    visitedCount: integer("visited_count").default(0).notNull(),
    recommendedTotal: integer("recommended_total").default(0).notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.cuisine] })]
);

export const dishProgress = pgTable(
  "dish_progress",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    cuisine: text("cuisine").notNull(),
    dishName: text("dish_name").notNull(),
    triedAt: timestamp("tried_at"),
  },
  (t) => [primaryKey({ columns: [t.userId, t.cuisine, t.dishName] })]
);

// ---------------------------------------------------------------------------
// YUU AI — Phase 5
// ---------------------------------------------------------------------------

export const aiConversations = pgTable("ai_conversations", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  messages: jsonb("messages").$type<{ role: "user" | "assistant"; content: string; cards?: unknown[] }[]>().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// Relations
// ---------------------------------------------------------------------------

export const restaurantsRelations = relations(restaurants, ({ many }) => ({
  sources: many(restaurantSources),
  dishes: many(restaurantDishes),
  photos: many(restaurantPhotos),
  visits: many(visits),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(profiles, { fields: [users.id], references: [profiles.userId] }),
  preferences: one(preferences, { fields: [users.id], references: [preferences.userId] }),
  visits: many(visits),
}));

export const visitsRelations = relations(visits, ({ one, many }) => ({
  restaurant: one(restaurants, { fields: [visits.restaurantId], references: [restaurants.id] }),
  user: one(users, { fields: [visits.userId], references: [users.id] }),
  dishes: many(visitDishes),
  rating: one(ratings, { fields: [visits.id], references: [ratings.visitId] }),
}));
