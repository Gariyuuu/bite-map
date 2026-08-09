import { Check, Heart, Star, Circle, Flame } from "lucide-react";
import type { RestaurantCard } from "@/types/ui";

export type MarkerStatusId = "favorite" | "visited" | "wishlist" | "trending" | "unvisited";

export const MARKER_STATUS_META: Record<
  MarkerStatusId,
  { label: string; icon: typeof Check; className: string; dot: string }
> = {
  favorite: { label: "Favorite", icon: Star, className: "text-amber-500", dot: "bg-amber-500" },
  visited: { label: "Visited", icon: Check, className: "text-emerald-500", dot: "bg-emerald-500" },
  wishlist: { label: "Wishlist", icon: Heart, className: "text-rose-500", dot: "bg-rose-500" },
  trending: { label: "Trending", icon: Flame, className: "text-orange-500", dot: "bg-orange-500" },
  unvisited: { label: "Not visited", icon: Circle, className: "text-muted-foreground", dot: "bg-muted-foreground/50" },
};

/** Marker/status priority so a favorite always reads as a favorite even if also trending. */
export function getMarkerStatus(card: Pick<RestaurantCard, "status" | "trendingScore">): MarkerStatusId {
  if (card.status?.isFavorite) return "favorite";
  if (card.status && card.status.visitCount > 0) return "visited";
  if (card.status?.isWishlist) return "wishlist";
  if ((card.trendingScore ?? 0) >= 80) return "trending";
  return "unvisited";
}
