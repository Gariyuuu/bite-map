"use client";

import { Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function ShareButton({ title }: { title: string }) {
  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // user cancelled — fall through to clipboard copy
      }
    }
    await navigator.clipboard.writeText(url);
    toast.success("Link copied");
  }

  return (
    <Button variant="outline" size="icon" onClick={share} aria-label="Share">
      <Share2 className="size-4" />
    </Button>
  );
}
