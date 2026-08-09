import Image from "next/image";
import { notFound } from "next/navigation";
import { Phone, Globe, MapPin } from "lucide-react";
import { getRestaurantById } from "@/lib/queries/restaurants";
import { getCurrentUserId } from "@/lib/auth";
import { getOpenStatus } from "@/lib/hours";
import { QuickActions } from "@/components/restaurants/quick-actions";
import { SourceBreakdown } from "@/components/restaurants/source-breakdown";
import { DishGuide } from "@/components/restaurants/dish-guide";
import { LogVisitDialog } from "@/components/restaurants/log-visit-dialog";
import { ShareButton } from "@/components/restaurants/share-button";
import { Badge } from "@/components/ui/badge";

export default async function RestaurantProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const decodedId = decodeURIComponent(id);
  const userId = await getCurrentUserId();
  const restaurant = await getRestaurantById(decodedId, userId);

  if (!restaurant) notFound();

  const openStatus = getOpenStatus(restaurant.openingHours);

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4">
      <div className="relative h-64 w-full overflow-hidden rounded-3xl bg-muted sm:h-80">
        {restaurant.heroPhotoUrl ? (
          <Image src={restaurant.heroPhotoUrl} alt={restaurant.name} fill priority className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">No photo yet</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        <div className="absolute inset-x-4 bottom-4 text-white">
          <h1 className="text-2xl font-bold sm:text-3xl">{restaurant.name}</h1>
          <p className="text-sm text-white/85">
            {restaurant.cuisines.join(" • ")}
            {restaurant.priceLevel ? ` • ${restaurant.priceLevel}` : ""}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          {restaurant.neighborhood && (
            <span className="flex items-center gap-1">
              <MapPin className="size-3.5" /> {restaurant.neighborhood}
            </span>
          )}
          <span className={openStatus.isOpen ? "font-medium text-emerald-600 dark:text-emerald-400" : "font-medium"}>
            {openStatus.label}
          </span>
          {restaurant.phone && (
            <a href={`tel:${restaurant.phone}`} className="flex items-center gap-1 hover:underline">
              <Phone className="size-3.5" /> {restaurant.phone}
            </a>
          )}
          {restaurant.website && (
            <a href={restaurant.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:underline">
              <Globe className="size-3.5" /> Website
            </a>
          )}
        </div>
        <div className="flex items-center gap-2">
          <QuickActions
            restaurantId={restaurant.id}
            restaurantName={restaurant.name}
            cuisines={restaurant.cuisines}
            status={restaurant.status}
          />
          <LogVisitDialog restaurantId={restaurant.id} restaurantName={restaurant.name} dishes={restaurant.dishes} />
          <ShareButton title={restaurant.name} />
        </div>
      </div>

      {restaurant.status && restaurant.status.visitCount > 0 && (
        <Badge variant="secondary">
          Visited {restaurant.status.visitCount} time{restaurant.status.visitCount > 1 ? "s" : ""}
          {restaurant.status.wouldReturn != null && (restaurant.status.wouldReturn ? " · Would return" : " · Wouldn't return")}
        </Badge>
      )}

      <SourceBreakdown sources={restaurant.sources} consensusScore={restaurant.consensusScore} consensusConfidence={restaurant.consensusConfidence} />

      <DishGuide dishes={restaurant.dishes} restaurantName={restaurant.name} />

      {restaurant.address && (
        <div className="rounded-2xl border border-border p-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Location</p>
          <p>{restaurant.address}</p>
          {restaurant.openingHours && (
            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs sm:grid-cols-1">
              {Object.entries(restaurant.openingHours).map(([day, hours]) => (
                <div key={day} className="flex justify-between gap-4 sm:max-w-xs">
                  <span className="uppercase text-muted-foreground/70">{day}</span>
                  <span>{hours}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
