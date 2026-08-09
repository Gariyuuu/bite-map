"use client";

import { useState } from "react";
import { Image as ImageIcon, UtensilsCrossed, Type, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RestaurantPickerDialog } from "./restaurant-picker-dialog";
import { CaptionDialog } from "./caption-dialog";
import { id } from "@/lib/id";
import type { BoardElement } from "@/types/photo-journal";
import type { VisitedRestaurantOption } from "@/lib/queries/visited";

const DEFAULT_SIZE: Record<BoardElement["type"], { width: number; height: number }> = {
  photo: { width: 34, height: 26 },
  "restaurant-card": { width: 30, height: 24 },
  caption: { width: 30, height: 10 },
  "date-stamp": { width: 22, height: 6 },
};

function nextPosition(count: number) {
  const step = (count % 5) * 8;
  return { x: 10 + step, y: 10 + step };
}

export function AddElementToolbar({
  elementCount,
  onAdd,
}: {
  elementCount: number;
  onAdd: (element: BoardElement) => void;
}) {
  const [pickerFor, setPickerFor] = useState<"photo" | "restaurant-card" | null>(null);
  const [captionOpen, setCaptionOpen] = useState(false);

  function baseFor(type: BoardElement["type"]) {
    const pos = nextPosition(elementCount);
    return { id: id("el"), type, ...pos, ...DEFAULT_SIZE[type], rotation: 0, z: elementCount + 1 } as const;
  }

  function handleRestaurantSelect(restaurant: VisitedRestaurantOption) {
    if (pickerFor === "photo" && restaurant.heroPhotoUrl) {
      onAdd({ ...baseFor("photo"), type: "photo", photoUrl: restaurant.heroPhotoUrl, caption: restaurant.name });
    } else if (pickerFor === "restaurant-card") {
      onAdd({
        ...baseFor("restaurant-card"),
        type: "restaurant-card",
        restaurantId: restaurant.id,
        restaurantName: restaurant.name,
        photoUrl: restaurant.heroPhotoUrl ?? undefined,
        cuisine: restaurant.cuisines[0],
      });
    }
  }

  return (
    <>
      <div className="glass-panel flex flex-wrap items-center justify-center gap-2 rounded-2xl p-2">
        <Button variant="outline" size="sm" onClick={() => setPickerFor("photo")}>
          <ImageIcon className="size-4" /> Photo
        </Button>
        <Button variant="outline" size="sm" onClick={() => setPickerFor("restaurant-card")}>
          <UtensilsCrossed className="size-4" /> Restaurant
        </Button>
        <Button variant="outline" size="sm" onClick={() => setCaptionOpen(true)}>
          <Type className="size-4" /> Caption
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onAdd({ ...baseFor("date-stamp"), type: "date-stamp", date: new Date().toISOString() })}
        >
          <CalendarDays className="size-4" /> Date
        </Button>
      </div>

      <RestaurantPickerDialog
        open={pickerFor !== null}
        onOpenChange={(open) => !open && setPickerFor(null)}
        onSelect={handleRestaurantSelect}
      />
      <CaptionDialog
        open={captionOpen}
        onOpenChange={setCaptionOpen}
        onSubmit={(text) => onAdd({ ...baseFor("caption"), type: "caption", text })}
      />
    </>
  );
}
