import Image from "next/image";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConsensusBadge } from "./consensus-badge";
import { QuickActions } from "./quick-actions";
import { distanceLabel } from "@/lib/geo";
import { getMarkerStatus, MARKER_STATUS_META } from "@/lib/restaurant-status";
import type { RestaurantCard as RestaurantCardData } from "@/types/ui";

export function RestaurantCard({ restaurant }: { restaurant: RestaurantCardData }) {
  const statusId = getMarkerStatus(restaurant);
  const statusMeta = MARKER_STATUS_META[statusId];
  const StatusIcon = statusMeta.icon;

  return (
    <Card className="group overflow-hidden py-0 gap-0">
      <Link href={`/restaurant/${encodeURIComponent(restaurant.id)}`} className="block">
        <div className="relative h-40 w-full overflow-hidden bg-muted">
          {restaurant.heroPhotoUrl ? (
            <Image
              src={restaurant.heroPhotoUrl}
              alt={restaurant.name}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
              No photo yet
            </div>
          )}
          <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-xs text-white backdrop-blur">
            <StatusIcon className={`size-3 ${statusMeta.className}`} />
            {statusMeta.label}
          </div>
          {restaurant.consensusScore != null && (
            <div className="absolute right-2 top-2">
              <ConsensusBadge score={restaurant.consensusScore} confidence={restaurant.consensusConfidence} size="sm" />
            </div>
          )}
        </div>
      </Link>

      <div className="flex flex-col gap-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/restaurant/${encodeURIComponent(restaurant.id)}`} className="min-w-0">
            <h3 className="truncate font-semibold leading-tight">{restaurant.name}</h3>
            <p className="truncate text-xs text-muted-foreground">
              {restaurant.cuisines.slice(0, 2).join(" • ")}
              {restaurant.priceLevel ? ` • ${restaurant.priceLevel}` : ""}
            </p>
          </Link>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1 truncate">
            <MapPin className="size-3 shrink-0" />
            {restaurant.neighborhood ?? restaurant.city ?? "Nearby"}
          </span>
          {restaurant.distanceMiles != null && <span>{distanceLabel(restaurant.distanceMiles)}</span>}
        </div>

        {restaurant.dishes[0] && (
          <Badge variant="secondary" className="w-fit text-[11px] font-normal">
            Try: {restaurant.dishes[0].name}
          </Badge>
        )}

        <div className="pt-1">
          <QuickActions
            restaurantId={restaurant.id}
            restaurantName={restaurant.name}
            cuisines={restaurant.cuisines}
            status={restaurant.status}
            size="sm"
          />
        </div>
      </div>
    </Card>
  );
}
