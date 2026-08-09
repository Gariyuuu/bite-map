"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Slide } from "@/lib/year-in-food-slides";

export function SlidePresentation({ slides }: { slides: Slide[] }) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  const next = useCallback(() => {
    setDirection(1);
    setIndex((i) => Math.min(i + 1, slides.length - 1));
  }, [slides.length]);

  const prev = useCallback(() => {
    setDirection(-1);
    setIndex((i) => Math.max(i - 1, 0));
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === " ") next();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "Escape") router.push("/profile");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev, router]);

  const slide = slides[index];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black text-white">
      <div className="flex gap-1 p-3">
        {slides.map((_, i) => (
          <div key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-white/20">
            <div className={cn("h-full bg-white transition-all", i < index && "w-full", i === index && "w-full", i > index && "w-0")} />
          </div>
        ))}
      </div>

      <button
        onClick={() => router.push("/profile")}
        className="absolute right-3 top-6 z-20 flex size-8 items-center justify-center rounded-full bg-white/10 text-white"
        aria-label="Close"
      >
        <X className="size-4" />
      </button>

      <div className="relative flex-1">
        <button className="absolute inset-y-0 left-0 z-10 w-1/3" aria-label="Previous slide" onClick={prev} />
        <button className="absolute inset-y-0 right-0 z-10 w-2/3" aria-label="Next slide" onClick={next} />

        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={index}
            custom={direction}
            initial={{ opacity: 0, x: direction * 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -direction * 40 }}
            transition={{ duration: 0.25 }}
            className={cn(
              "absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gradient-to-br px-8 text-center",
              slide.gradient
            )}
          >
            <span className="text-6xl">{slide.emoji}</span>
            <p className="text-sm font-medium uppercase tracking-widest text-white/80">{slide.eyebrow}</p>
            <p className="text-balance font-serif text-4xl font-bold sm:text-5xl">{slide.value}</p>
            {slide.subtitle && <p className="text-lg text-white/90">{slide.subtitle}</p>}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-center gap-2 p-4 text-xs text-white/60">
        {index + 1} / {slides.length} · tap or use arrow keys
      </div>
    </div>
  );
}
