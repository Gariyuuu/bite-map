import type { ConsensusConfidence, NormalizedDish, PriceLevel, ProviderId } from "@/types/restaurant";

export interface SourceRating {
  provider: ProviderId;
  rating: number;
  ratingScale: number;
  ratingCount: number;
}

/**
 * Shared shape every restaurant UI component renders from, regardless of
 * whether the data came from the database or a live/mock provider fallback.
 * Keeping one shape means Map, Discover, and the profile page never need to
 * branch on "is this DB-backed or not."
 */
export interface RestaurantCard {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  neighborhood?: string;
  cuisines: string[];
  priceLevel?: PriceLevel;
  heroPhotoUrl?: string;
  photos: string[];
  website?: string;
  phone?: string;
  openingHours?: Record<string, string>;
  dishes: NormalizedDish[];
  consensusScore?: number;
  consensusConfidence?: ConsensusConfidence;
  popularityScore?: number;
  trendingScore?: number;
  distanceMiles?: number;
  status?: RestaurantStatusFlags;
  sources?: SourceRating[];
  source: "db" | "mock" | "live";
}

export interface RestaurantStatusFlags {
  isWishlist: boolean;
  isFavorite: boolean;
  isPlanned: boolean;
  visitCount: number;
  lastVisitedAt?: string;
  wouldReturn?: boolean | null;
}

export const EMPTY_STATUS: RestaurantStatusFlags = {
  isWishlist: false,
  isFavorite: false,
  isPlanned: false,
  visitCount: 0,
};
