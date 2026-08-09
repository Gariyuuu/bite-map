export type PriceLevel = "$" | "$$" | "$$$" | "$$$$";

export type ProviderId = "google" | "yelp" | "foursquare" | "osm" | "mock" | "manual";

export type DishPriority =
  | "must_try"
  | "popular"
  | "local_favorite"
  | "staff_favorite"
  | "underrated"
  | "safe_pick"
  | "adventurous"
  | "dessert"
  | "best_value";

export interface NormalizedDish {
  name: string;
  description?: string;
  photoUrl?: string;
  estimatedPrice?: number;
  spiceLevel?: 0 | 1 | 2 | 3;
  dietaryTags?: string[];
  priority?: DishPriority;
  whyOrder?: string;
}

/**
 * The shape every provider adapter must normalize into. This is the only
 * contract the rest of the app depends on — swapping/adding a data source
 * never touches map, discovery, or profile code.
 */
export interface NormalizedRestaurant {
  provider: ProviderId;
  externalId: string;
  name: string;
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  neighborhood?: string;
  zip?: string;
  cuisines: string[];
  priceLevel?: PriceLevel;
  rating?: number; // native scale for this provider
  ratingScale?: number; // e.g. 5 for Google/Yelp, 100 for %-based sources. Defaults to 5.
  ratingCount?: number;
  photos?: string[];
  website?: string;
  phone?: string;
  openingHours?: Record<string, string>;
  googlePlaceId?: string;
  yelpId?: string;
  foursquareId?: string;
  osmId?: string;
  signatureDishes?: NormalizedDish[];
  sourceUrl?: string;
}

export type ConsensusConfidence = "low" | "medium" | "high" | "very_high";

export interface ConsensusResult {
  score: number; // 0-100
  confidence: ConsensusConfidence;
  totalReviews: number;
  sources: {
    provider: ProviderId;
    normalizedScore: number; // 0-100
    rating: number;
    ratingScale: number;
    ratingCount: number;
  }[];
}

export type RestaurantStatus =
  | "unvisited"
  | "wishlist"
  | "planned"
  | "visited"
  | "favorite"
  | "would_return"
  | "would_not_return";
