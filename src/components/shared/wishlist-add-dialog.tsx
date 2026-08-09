"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { DEFAULT_LOCATION } from "@/lib/neighborhoods";
import { addToSharedWishlist } from "@/lib/actions/shared-space";
import type { RestaurantCard } from "@/types/ui";

export function WishlistAddDialog({ sharedSpaceId }: { sharedSpaceId: string }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<RestaurantCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [pending, startTransition] = useTransition();

  function search(q: string) {
    setQuery(q);
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    fetch(
      `/api/restaurants/nearby?lat=${DEFAULT_LOCATION.latitude}&lng=${DEFAULT_LOCATION.longitude}&radius=30&q=${encodeURIComponent(q)}`
    )
      .then((res) => res.json())
      .then((data) => setResults(data.restaurants ?? []))
      .finally(() => setLoading(false));
  }

  function add(restaurantId: string) {
    startTransition(async () => {
      try {
        await addToSharedWishlist(sharedSpaceId, restaurantId);
        toast.success("Added to shared wishlist");
        setOpen(false);
        setQuery("");
        setResults([]);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Couldn't add this restaurant");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>Add to wishlist</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add a restaurant to your shared wishlist</DialogTitle>
        </DialogHeader>
        <Input placeholder="Search restaurants or cuisines..." value={query} onChange={(e) => search(e.target.value)} autoFocus />
        <ScrollArea className="h-72">
          {loading && <p className="p-3 text-sm text-muted-foreground">Searching...</p>}
          {!loading && query.length >= 2 && results.length === 0 && (
            <p className="p-3 text-sm text-muted-foreground">No matches nearby.</p>
          )}
          <div className="space-y-1.5 p-1">
            {results.map((r) => (
              <button
                key={r.id}
                onClick={() => add(r.id)}
                disabled={pending}
                className="flex w-full items-center gap-2.5 rounded-lg border border-border p-2 text-left transition-colors hover:border-accent disabled:opacity-50"
              >
                <div className="relative size-10 shrink-0 overflow-hidden rounded-md bg-muted">
                  {r.heroPhotoUrl && <Image src={r.heroPhotoUrl} alt={r.name} fill className="object-cover" />}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{r.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{r.cuisines.slice(0, 2).join(" • ")}</p>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
