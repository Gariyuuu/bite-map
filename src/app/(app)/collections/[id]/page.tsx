import { notFound } from "next/navigation";
import { getCollectionWithRestaurants } from "@/lib/queries/collections";
import { RestaurantCard } from "@/components/restaurants/restaurant-card";
import { EMPTY_STATUS } from "@/types/ui";
import type { RestaurantCard as RestaurantCardData } from "@/types/ui";

export default async function CollectionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getCollectionWithRestaurants(id);
  if (!data) notFound();

  const cards: RestaurantCardData[] = data.restaurants.map((r) => ({
    id: r.id,
    name: r.name,
    latitude: r.latitude,
    longitude: r.longitude,
    address: r.address ?? undefined,
    city: r.city ?? undefined,
    neighborhood: r.neighborhood ?? undefined,
    cuisines: r.cuisines ?? [],
    priceLevel: r.priceLevel ?? undefined,
    heroPhotoUrl: r.heroPhotoUrl ?? undefined,
    photos: r.heroPhotoUrl ? [r.heroPhotoUrl] : [],
    dishes: [],
    consensusScore: r.consensusScore ?? undefined,
    consensusConfidence: (r.consensusConfidence as RestaurantCardData["consensusConfidence"]) ?? undefined,
    status: EMPTY_STATUS,
    source: "db",
  }));

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{data.collection.name}</h1>
        {data.collection.description && <p className="text-sm text-muted-foreground">{data.collection.description}</p>}
        <p className="text-xs text-muted-foreground">{cards.length} restaurants</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {cards.map((r) => (
          <RestaurantCard key={r.id} restaurant={r} />
        ))}
      </div>
    </div>
  );
}
