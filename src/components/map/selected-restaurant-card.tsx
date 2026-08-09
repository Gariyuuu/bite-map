"use client";

import Link from "next/link";
import Image from "next/image";
import { X, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConsensusBadge } from "@/components/restaurants/consensus-badge";
import { QuickActions } from "@/components/restaurants/quick-actions";
import { getOpenStatus } from "@/lib/hours";
import { distanceLabel } from "@/lib/geo";
import type { RestaurantCard } from "@/types/ui";

export function SelectedRestaurantCard({ restaurant, onClose }: { restaurant: RestaurantCard; onClose: () => void }) {
  const openStatus = getOpenStatus(restaurant.openingHours);

  return (
    <motion.div
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 40, opacity: 0 }}
      className="glass-panel absolute bottom-4 left-4 right-4 z-30 flex gap-3 rounded-2xl p-3 shadow-xl md:left-auto md:right-4 md:w-80"
    >
      <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-muted">
        {restaurant.heroPhotoUrl && (
          <Image src={restaurant.heroPhotoUrl} alt={restaurant.name} fill className="object-cover" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/restaurant/${encodeURIComponent(restaurant.id)}`} className="min-w-0">
            <span className="flex items-center gap-1.5">
              <h3 className="truncate font-semibold leading-tight">{restaurant.name}</h3>
              {restaurant.isFabricated && (
                <Badge variant="outline" className="shrink-0 px-1.5 py-0 text-[10px] font-normal text-muted-foreground">
                  Demo
                </Badge>
              )}
            </span>
          </Link>
          <Button variant="ghost" size="icon" className="size-6 shrink-0" onClick={onClose}>
            <X className="size-3.5" />
          </Button>
        </div>
        <p className="truncate text-xs text-muted-foreground">
          {restaurant.cuisines.slice(0, 2).join(" • ")} {restaurant.priceLevel ? `• ${restaurant.priceLevel}` : ""}
        </p>
        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
          <span className={openStatus.isOpen ? "text-emerald-600 dark:text-emerald-400" : ""}>{openStatus.label}</span>
          {restaurant.distanceMiles != null && (
            <span className="flex items-center gap-0.5">
              <MapPin className="size-3" />
              {distanceLabel(restaurant.distanceMiles)}
            </span>
          )}
        </div>
        <div className="mt-2 flex items-center justify-between gap-2">
          <ConsensusBadge score={restaurant.consensusScore} confidence={restaurant.consensusConfidence} size="sm" />
          <QuickActions
            restaurantId={restaurant.id}
            restaurantName={restaurant.name}
            cuisines={restaurant.cuisines}
            status={restaurant.status}
            size="sm"
          />
        </div>
      </div>
    </motion.div>
  );
}
