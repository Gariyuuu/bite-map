"use client";

import { motion } from "framer-motion";
import { Sparkles, Wrench, Palette, Server } from "lucide-react";
import { cn } from "@/lib/utils";

export type PatchTag = "feature" | "fix" | "design" | "infra";

export interface PatchRelease {
  version: string;
  title: string;
  date: string;
  tags: PatchTag[];
  notes: string[];
}

const TAG_META: Record<PatchTag, { label: string; icon: typeof Sparkles; className: string }> = {
  feature: { label: "Feature", icon: Sparkles, className: "bg-sky-500/15 text-sky-600 dark:text-sky-400" },
  fix: { label: "Fix", icon: Wrench, className: "bg-rose-500/15 text-rose-600 dark:text-rose-400" },
  design: { label: "Design", icon: Palette, className: "bg-violet-500/15 text-violet-600 dark:text-violet-400" },
  infra: { label: "Infra", icon: Server, className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" },
};

export function PatchTimeline({ releases }: { releases: PatchRelease[] }) {
  return (
    <div className="relative space-y-6 pl-6">
      <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" aria-hidden />

      {releases.map((release, i) => (
        <motion.div
          key={release.version}
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.35, delay: Math.min(i, 4) * 0.05 }}
          className="relative"
        >
          <span
            className={cn(
              "absolute -left-6 top-1.5 size-3.5 rounded-full border-2 border-background",
              i === 0 ? "bg-accent" : "bg-muted-foreground/40"
            )}
            aria-hidden
          />

          <div className="rounded-2xl border border-border p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">{release.version}</h2>
                <span className="text-sm text-muted-foreground">{release.title}</span>
              </div>
              <span className="text-xs text-muted-foreground">{release.date}</span>
            </div>

            <div className="my-2 flex flex-wrap gap-1.5">
              {release.tags.map((tag) => {
                const meta = TAG_META[tag];
                return (
                  <span
                    key={tag}
                    className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium", meta.className)}
                  >
                    <meta.icon className="size-3" />
                    {meta.label}
                  </span>
                );
              })}
            </div>

            <ul className="list-disc space-y-1 pl-5 text-sm text-foreground/90">
              {release.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
