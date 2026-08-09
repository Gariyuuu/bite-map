"use client";

import Image from "next/image";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { ConsensusBadge } from "@/components/restaurants/consensus-badge";
import { QuickActions } from "@/components/restaurants/quick-actions";
import type { AiRecommendationCard as CardData } from "@/lib/queries/restaurant-lookup";

/** Renders YUU's structured restaurant pick (spec section 16, "Tonight's Pick"). */
export function RecommendationCard({ card }: { card: CardData }) {
  return (
    <div className="w-full max-w-xs overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="relative h-28 w-full bg-muted">
        {card.heroPhotoUrl && <Image src={card.heroPhotoUrl} alt={card.name} fill className="object-cover" />}
        {card.consensusScore != null && (
          <div className="absolute right-2 top-2">
            <ConsensusBadge score={card.consensusScore} confidence={card.consensusConfidence ?? undefined} size="sm" />
          </div>
        )}
      </div>
      <div className="space-y-2 p-3">
        <div>
          <p className="font-semibold leading-tight">{card.name}</p>
          <p className="text-xs text-muted-foreground">
            {card.cuisines.slice(0, 2).join(" • ")}
            {card.priceLevel ? ` • ${card.priceLevel}` : ""}
          </p>
        </div>

        {card.mustOrderDishes.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Must Order</p>
            <p className="text-sm">{card.mustOrderDishes.join(", ")}</p>
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          <QuickActions restaurantId={card.restaurantId} restaurantName={card.name} cuisines={card.cuisines} size="sm" />
          <Link
            href={`/restaurant/${encodeURIComponent(card.restaurantId)}`}
            className="flex items-center gap-1 text-xs font-medium text-accent hover:underline"
          >
            View <ExternalLink className="size-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
