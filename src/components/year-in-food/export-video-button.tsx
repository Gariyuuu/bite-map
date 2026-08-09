"use client";

import { useState } from "react";
import { Video } from "lucide-react";
import { toast } from "sonner";
import { renderYearInFoodVideo } from "@/lib/year-in-food-video";
import type { Slide } from "@/lib/year-in-food-slides";

export function ExportVideoButton({ slides, filename }: { slides: Slide[]; filename: string }) {
  const [progress, setProgress] = useState<{ slideIndex: number; total: number } | null>(null);

  async function exportVideo() {
    if (progress) return;
    setProgress({ slideIndex: 0, total: slides.length });
    try {
      const blob = await renderYearInFoodVideo(slides, setProgress);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${filename}.webm`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("Video ready");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't render this video");
    } finally {
      setProgress(null);
    }
  }

  return (
    <>
      <button
        onClick={exportVideo}
        disabled={progress !== null}
        className="flex size-8 items-center justify-center rounded-full bg-white/10 text-white disabled:opacity-50"
        aria-label="Export flipbook video"
      >
        <Video className="size-4" />
      </button>
      {progress && (
        <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-3 bg-black/90 text-white">
          <Video className="size-8 animate-pulse" />
          <p className="text-sm">
            Rendering slide {progress.slideIndex + 1} / {progress.total}...
          </p>
          <div className="h-1 w-48 overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full bg-white transition-all"
              style={{ width: `${((progress.slideIndex + 1) / progress.total) * 100}%` }}
            />
          </div>
        </div>
      )}
    </>
  );
}
