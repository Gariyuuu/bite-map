"use client";

import { useState } from "react";
import { MapPin, Navigation, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Command, CommandInput, CommandList, CommandItem, CommandEmpty, CommandGroup } from "@/components/ui/command";
import { useLocation } from "./location-provider";
import { LOCATION_PRESETS } from "@/lib/neighborhoods";

export function LocationConsentDialog() {
  const { dialogOpen, setDialogOpen, requestBrowserLocation, setManualLocation, dismiss } = useLocation();
  const [showManual, setShowManual] = useState(false);

  function handleOpenChange(open: boolean) {
    setDialogOpen(open);
    if (!open) setShowManual(false);
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        {!showManual ? (
          <>
            <DialogHeader>
              <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-accent/15">
                <MapPin className="size-6 text-accent" />
              </div>
              <DialogTitle className="text-center">Use your location to discover restaurants around you</DialogTitle>
              <DialogDescription className="text-center">
                Location is only used for nearby restaurant discovery, map positioning, distance
                estimates, and local recommendations. We never collect it silently or track you in
                the background — you can change this anytime in Profile.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex-col gap-2 sm:flex-col">
              <Button className="w-full" onClick={requestBrowserLocation}>
                <Navigation className="size-4" />
                Allow location
              </Button>
              <Button variant="outline" className="w-full" onClick={() => setShowManual(true)}>
                <Search className="size-4" />
                Enter location manually
              </Button>
              <Button variant="ghost" className="w-full" onClick={dismiss}>
                Not now
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Choose your area</DialogTitle>
              <DialogDescription>Pick a neighborhood to explore. You can change this anytime.</DialogDescription>
            </DialogHeader>
            <Command>
              <CommandInput placeholder="Search a city or neighborhood..." />
              <CommandList>
                <CommandEmpty>No matches.</CommandEmpty>
                <CommandGroup>
                  {LOCATION_PRESETS.map((preset) => (
                    <CommandItem
                      key={preset.label}
                      onSelect={() =>
                        setManualLocation({ latitude: preset.latitude, longitude: preset.longitude }, preset.label)
                      }
                    >
                      <MapPin className="size-4 text-muted-foreground" />
                      {preset.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
