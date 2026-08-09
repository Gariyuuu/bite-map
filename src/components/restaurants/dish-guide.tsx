import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { DishPriority, NormalizedDish } from "@/types/restaurant";

const PRIORITY_META: Record<DishPriority, { label: string; className: string }> = {
  must_try: { label: "Must Try", className: "bg-rose-500/15 text-rose-600 dark:text-rose-400" },
  popular: { label: "Popular", className: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
  local_favorite: { label: "Local Favorite", className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" },
  staff_favorite: { label: "Staff Favorite", className: "bg-purple-500/15 text-purple-600 dark:text-purple-400" },
  underrated: { label: "Underrated", className: "bg-sky-500/15 text-sky-600 dark:text-sky-400" },
  safe_pick: { label: "Safe Pick", className: "bg-muted text-muted-foreground" },
  adventurous: { label: "Adventurous", className: "bg-fuchsia-500/15 text-fuchsia-600 dark:text-fuchsia-400" },
  dessert: { label: "Dessert", className: "bg-pink-500/15 text-pink-600 dark:text-pink-400" },
  best_value: { label: "Best Value", className: "bg-lime-500/15 text-lime-600 dark:text-lime-400" },
};

function SpiceLevel({ level }: { level?: 0 | 1 | 2 | 3 }) {
  if (!level) return null;
  return (
    <span className="text-xs" title={`Spice level ${level}/3`}>
      {"🌶️".repeat(level)}
    </span>
  );
}

export function DishGuide({ dishes, restaurantName }: { dishes: NormalizedDish[]; restaurantName: string }) {
  if (dishes.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
        No dish guide yet for {restaurantName}.
      </div>
    );
  }

  const mustTry = dishes.filter((d) => d.priority === "must_try");
  const suggestion =
    mustTry.length > 0
      ? `If this is your first visit, order: ${mustTry
          .slice(0, 3)
          .map((d) => d.name)
          .join(", ")}.`
      : null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Famous For</h3>
      </div>
      {suggestion && <p className="rounded-xl bg-accent/10 px-3 py-2 text-sm text-foreground">{suggestion}</p>}
      <div className="grid gap-2 sm:grid-cols-2">
        {dishes.map((dish) => {
          const meta = dish.priority ? PRIORITY_META[dish.priority] : null;
          return (
            <div key={dish.name} className="rounded-xl border border-border p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium leading-tight">{dish.name}</p>
                <SpiceLevel level={dish.spiceLevel} />
              </div>
              {dish.description && <p className="mt-0.5 text-xs text-muted-foreground">{dish.description}</p>}
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {meta && <Badge className={cn("border-none text-[11px]", meta.className)}>{meta.label}</Badge>}
                {dish.estimatedPrice != null && (
                  <span className="text-xs text-muted-foreground">${dish.estimatedPrice.toFixed(2)}</span>
                )}
                {dish.dietaryTags?.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-[11px]">
                    {tag}
                  </Badge>
                ))}
              </div>
              {dish.whyOrder && <p className="mt-1.5 text-xs italic text-muted-foreground">&quot;{dish.whyOrder}&quot;</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
