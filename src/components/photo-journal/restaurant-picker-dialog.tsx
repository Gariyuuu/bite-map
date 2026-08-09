"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { VisitedRestaurantOption } from "@/lib/queries/visited";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (restaurant: VisitedRestaurantOption) => void;
}

export function RestaurantPickerDialog({ open, onOpenChange, onSelect }: Props) {
  const [restaurants, setRestaurants] = useState<VisitedRestaurantOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    // Resetting loading state at the start of each fetch is standard for this pattern.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    fetch("/api/journal/visited")
      .then((res) => res.json())
      .then((data) => setRestaurants(data.restaurants ?? []))
      .finally(() => setLoading(false));
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pick from your visited restaurants</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-80">
          {loading && <p className="p-4 text-sm text-muted-foreground">Loading...</p>}
          {!loading && restaurants.length === 0 && (
            <p className="p-4 text-sm text-muted-foreground">
              Mark some restaurants as visited first — this board pulls from your real history.
            </p>
          )}
          <div className="grid grid-cols-2 gap-2 p-1">
            {restaurants.map((r) => (
              <button
                key={r.id}
                onClick={() => {
                  onSelect(r);
                  onOpenChange(false);
                }}
                className="flex flex-col overflow-hidden rounded-lg border border-border text-left transition-colors hover:border-accent"
              >
                <div className="relative h-16 w-full bg-muted">
                  {r.heroPhotoUrl && <Image src={r.heroPhotoUrl} alt={r.name} fill className="object-cover" />}
                </div>
                <span className="truncate px-2 py-1 text-xs font-medium">{r.name}</span>
              </button>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
