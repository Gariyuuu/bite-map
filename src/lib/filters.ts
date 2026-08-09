import type { RestaurantCard } from "@/types/ui";
import { getOpenStatus } from "./hours";

export type FilterId =
  | "visited"
  | "not_visited"
  | "wishlist"
  | "favorites"
  | "highly_rated"
  | "trending"
  | "open_now"
  | "cheap_eats"
  | "fine_dining"
  | "michelin"
  | "date_night"
  | "dessert"
  | "coffee";

export const FILTER_DEFS: { id: FilterId; label: string }[] = [
  { id: "visited", label: "Visited" },
  { id: "not_visited", label: "Not Visited" },
  { id: "wishlist", label: "Wishlist" },
  { id: "favorites", label: "Favorites" },
  { id: "highly_rated", label: "Highly Rated" },
  { id: "trending", label: "Trending" },
  { id: "open_now", label: "Open Now" },
  { id: "cheap_eats", label: "Cheap Eats" },
  { id: "fine_dining", label: "Fine Dining" },
  { id: "michelin", label: "Michelin" },
  { id: "date_night", label: "Date Night" },
  { id: "dessert", label: "Dessert" },
  { id: "coffee", label: "Coffee" },
];

function matchesFilter(r: RestaurantCard, id: FilterId): boolean {
  switch (id) {
    case "visited":
      return (r.status?.visitCount ?? 0) > 0;
    case "not_visited":
      return (r.status?.visitCount ?? 0) === 0;
    case "wishlist":
      return Boolean(r.status?.isWishlist);
    case "favorites":
      return Boolean(r.status?.isFavorite);
    case "highly_rated":
      return (r.consensusScore ?? 0) >= 85;
    case "trending":
      return (r.trendingScore ?? 0) >= 75;
    case "open_now":
      return getOpenStatus(r.openingHours).isOpen === true;
    case "cheap_eats":
      return r.priceLevel === "$";
    case "fine_dining":
      return r.priceLevel === "$$$$";
    case "michelin":
      return r.cuisines.some((c) => /michelin/i.test(c)) || (r.consensusScore ?? 0) >= 92;
    case "date_night":
      return r.cuisines.some((c) => /date night/i.test(c));
    case "dessert":
      return r.cuisines.some((c) => /dessert/i.test(c));
    case "coffee":
      return r.cuisines.some((c) => /cafe|coffee/i.test(c));
    default:
      return true;
  }
}

export function applyFilters(
  restaurants: RestaurantCard[],
  activeFilters: Set<FilterId>,
  activeCuisines: Set<string>
): RestaurantCard[] {
  return restaurants.filter((r) => {
    for (const f of activeFilters) {
      if (!matchesFilter(r, f)) return false;
    }
    if (activeCuisines.size > 0 && !r.cuisines.some((c) => activeCuisines.has(c))) return false;
    return true;
  });
}
