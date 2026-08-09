"use client";

import { useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toggleWishlistVote, removeFromSharedWishlist } from "@/lib/actions/shared-space";
import type { SharedWishlistItem } from "@/lib/queries/shared-space";

export function WishlistItemCard({ item, currentUserId }: { item: SharedWishlistItem; currentUserId: string }) {
  const [pending, startTransition] = useTransition();
  const voted = item.votes.includes(currentUserId);

  function vote() {
    startTransition(async () => {
      try {
        await toggleWishlistVote(item.id);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Couldn't vote");
      }
    });
  }

  function remove() {
    startTransition(async () => {
      try {
        await removeFromSharedWishlist(item.id);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Couldn't remove this");
      }
    });
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border p-2.5">
      <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-muted">
        {item.heroPhotoUrl && <Image src={item.heroPhotoUrl} alt={item.name} fill className="object-cover" />}
      </div>
      <div className="min-w-0 flex-1">
        <Link href={`/restaurant/${encodeURIComponent(item.restaurantId)}`} className="truncate text-sm font-medium hover:underline">
          {item.name}
        </Link>
        <p className="truncate text-xs text-muted-foreground">
          {item.cuisines.slice(0, 2).join(" • ")}
          {item.addedByName ? ` · added by ${item.addedByName}` : ""}
        </p>
      </div>
      <Button variant={voted ? "default" : "outline"} size="sm" onClick={vote} disabled={pending} className="shrink-0">
        <Heart className={cn("size-3.5", voted && "fill-current")} />
        {item.votes.length}
      </Button>
      <Button variant="ghost" size="icon" onClick={remove} disabled={pending} aria-label="Remove from wishlist" className="shrink-0">
        <X className="size-3.5" />
      </Button>
    </div>
  );
}
