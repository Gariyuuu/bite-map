"use client";

import { useState, useTransition } from "react";
import { Heart, Star, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toggleWishlist, toggleFavorite, quickCheckIn } from "@/lib/actions/status";
import type { RestaurantStatusFlags } from "@/types/ui";

interface Props {
  restaurantId: string;
  restaurantName: string;
  cuisines: string[];
  status?: RestaurantStatusFlags;
  size?: "sm" | "md";
}

export function QuickActions({ restaurantId, restaurantName, cuisines, status, size = "md" }: Props) {
  const [isWishlist, setIsWishlist] = useState(status?.isWishlist ?? false);
  const [isFavorite, setIsFavorite] = useState(status?.isFavorite ?? false);
  const [visited, setVisited] = useState((status?.visitCount ?? 0) > 0);
  const [pending, startTransition] = useTransition();

  function guard(action: () => Promise<void>) {
    startTransition(async () => {
      try {
        await action();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  const iconSize = size === "sm" ? "size-3.5" : "size-4";

  return (
    <div className="flex items-center gap-1.5">
      <Button
        variant={isWishlist ? "default" : "outline"}
        size="icon"
        className={cn("rounded-full", size === "sm" && "size-7")}
        disabled={pending}
        aria-label="Toggle wishlist"
        onClick={() =>
          guard(async () => {
            const next = !isWishlist;
            setIsWishlist(next);
            await toggleWishlist(restaurantId, next);
          })
        }
      >
        <Heart className={cn(iconSize, isWishlist && "fill-current")} />
      </Button>
      <Button
        variant={isFavorite ? "default" : "outline"}
        size="icon"
        className={cn("rounded-full", size === "sm" && "size-7")}
        disabled={pending}
        aria-label="Toggle favorite"
        onClick={() =>
          guard(async () => {
            const next = !isFavorite;
            setIsFavorite(next);
            await toggleFavorite(restaurantId, next);
          })
        }
      >
        <Star className={cn(iconSize, isFavorite && "fill-current")} />
      </Button>
      <Button
        variant={visited ? "default" : "outline"}
        size="icon"
        className={cn("rounded-full", size === "sm" && "size-7")}
        disabled={pending || visited}
        aria-label="Mark as been here"
        onClick={() =>
          guard(async () => {
            setVisited(true);
            await quickCheckIn({ restaurantId, restaurantName, cuisines });
            toast.success(`Marked ${restaurantName} as visited`);
          })
        }
      >
        <Check className={iconSize} />
      </Button>
    </div>
  );
}
