"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { SharedWishlistItem } from "@/lib/queries/shared-space";

export function WishlistRandomizer({ items }: { items: SharedWishlistItem[] }) {
  const [spinning, setSpinning] = useState(false);
  const [picked, setPicked] = useState<SharedWishlistItem | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);

  function spin() {
    if (items.length === 0 || spinning) return;
    setSpinning(true);
    setPicked(null);

    let ticks = 0;
    const totalTicks = 16;
    const interval = setInterval(() => {
      setDisplayName(items[Math.floor(Math.random() * items.length)].name);
      ticks += 1;
      if (ticks >= totalTicks) {
        clearInterval(interval);
        const winner = items[Math.floor(Math.random() * items.length)];
        setDisplayName(winner.name);
        setPicked(winner);
        setSpinning(false);
      }
    }, 90);
  }

  if (items.length === 0) return null;

  return (
    <Card className="space-y-3 p-4 text-center">
      <Button onClick={spin} disabled={spinning} className="mx-auto">
        <Sparkles className="size-4" />
        {spinning ? "Deciding..." : "What should we eat?"}
      </Button>
      {displayName && (
        <div>
          <p className={picked ? "text-lg font-semibold" : "text-lg font-semibold text-muted-foreground"}>{displayName}</p>
          {picked && (
            <Link href={`/restaurant/${encodeURIComponent(picked.restaurantId)}`} className="text-xs text-accent underline">
              View restaurant
            </Link>
          )}
        </div>
      )}
    </Card>
  );
}
