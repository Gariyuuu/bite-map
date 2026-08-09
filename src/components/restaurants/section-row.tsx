import { RestaurantCard } from "./restaurant-card";
import type { RestaurantCard as RestaurantCardData } from "@/types/ui";

export function SectionRow({ title, restaurants }: { title: string; restaurants: RestaurantCardData[] }) {
  if (restaurants.length === 0) return null;

  return (
    <section className="space-y-2">
      <h2 className="px-1 text-sm font-semibold text-muted-foreground">{title}</h2>
      <div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {restaurants.map((r) => (
          <div key={r.id} className="w-64 shrink-0">
            <RestaurantCard restaurant={r} />
          </div>
        ))}
      </div>
    </section>
  );
}
