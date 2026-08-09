"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { RefObject } from "react";

interface Props {
  boardRef: RefObject<HTMLDivElement | null>;
  filename: string;
}

/** Exports the board as a PNG image collage (spec section 38). Client-only — html-to-image renders the live DOM to canvas. */
export function ExportBoardButton({ boardRef, filename }: Props) {
  const [pending, setPending] = useState(false);

  async function exportPng() {
    if (!boardRef.current) return;
    setPending(true);
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(boardRef.current, {
        pixelRatio: 2,
        cacheBust: true,
      });
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `${filename}.png`;
      link.click();
      toast.success("Board exported");
    } catch {
      toast.error("Couldn't export this board — try again");
    } finally {
      setPending(false);
    }
  }

  return (
    <Button variant="outline" size="icon" onClick={exportPng} disabled={pending} aria-label="Export as image">
      <Download className="size-4" />
    </Button>
  );
}
