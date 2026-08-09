"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { FILTER_DEFS, type FilterId } from "@/lib/filters";

interface Props {
  activeFilters: Set<FilterId>;
  onToggle: (id: FilterId) => void;
  cuisines: string[];
  activeCuisines: Set<string>;
  onToggleCuisine: (cuisine: string) => void;
}

export function FilterBar({ activeFilters, onToggle, cuisines, activeCuisines, onToggleCuisine }: Props) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {FILTER_DEFS.map((f) => (
        <Badge
          key={f.id}
          variant={activeFilters.has(f.id) ? "default" : "outline"}
          className={cn("shrink-0 cursor-pointer select-none px-3 py-1 text-xs")}
          onClick={() => onToggle(f.id)}
        >
          {f.label}
        </Badge>
      ))}
      {cuisines.length > 0 && <div className="mx-1 w-px shrink-0 self-stretch bg-border" />}
      {cuisines.map((c) => (
        <Badge
          key={c}
          variant={activeCuisines.has(c) ? "default" : "outline"}
          className="shrink-0 cursor-pointer select-none px-3 py-1 text-xs"
          onClick={() => onToggleCuisine(c)}
        >
          {c}
        </Badge>
      ))}
    </div>
  );
}
