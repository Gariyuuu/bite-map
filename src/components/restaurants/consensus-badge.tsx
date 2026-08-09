import { cn } from "@/lib/utils";
import type { ConsensusConfidence } from "@/types/restaurant";

const CONFIDENCE_LABEL: Record<ConsensusConfidence, string> = {
  low: "Low confidence",
  medium: "Medium confidence",
  high: "High confidence",
  very_high: "Very high confidence",
};

export function ConsensusBadge({
  score,
  confidence,
  size = "md",
}: {
  score?: number;
  confidence?: ConsensusConfidence;
  size?: "sm" | "md" | "lg";
}) {
  if (score == null) return null;

  const color =
    score >= 85
      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
      : score >= 70
        ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
        : "bg-muted text-muted-foreground";

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-semibold",
        color,
        size === "sm" && "px-2 py-0.5 text-xs",
        size === "md" && "px-2.5 py-1 text-sm",
        size === "lg" && "px-3 py-1.5 text-base"
      )}
      title={confidence ? CONFIDENCE_LABEL[confidence] : undefined}
    >
      <span>{score}</span>
      <span className="text-[0.7em] font-normal opacity-70">/100</span>
    </div>
  );
}
