import { ConsensusBadge } from "./consensus-badge";
import type { ConsensusConfidence, ProviderId } from "@/types/restaurant";
import type { SourceRating } from "@/types/ui";

const PROVIDER_LABEL: Record<ProviderId, string> = {
  google: "Google",
  yelp: "Yelp",
  foursquare: "Foursquare",
  osm: "OpenStreetMap",
  mock: "BiteMap Sample",
  manual: "Manual",
};

const CONFIDENCE_LABEL: Record<ConsensusConfidence, string> = {
  low: "Low Confidence",
  medium: "Medium Confidence",
  high: "High Confidence",
  very_high: "Very High Confidence",
};

export function SourceBreakdown({
  sources,
  consensusScore,
  consensusConfidence,
}: {
  sources?: SourceRating[];
  consensusScore?: number;
  consensusConfidence?: ConsensusConfidence;
}) {
  if (!sources?.length && consensusScore == null) return null;

  const totalReviews = sources?.reduce((sum, s) => sum + s.ratingCount, 0) ?? 0;

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Internet Consensus</h3>
        {consensusScore != null && <ConsensusBadge score={consensusScore} confidence={consensusConfidence} size="lg" />}
      </div>
      {consensusConfidence && (
        <p className="text-xs text-muted-foreground">
          {CONFIDENCE_LABEL[consensusConfidence]} · Based on {totalReviews.toLocaleString()} combined ratings
        </p>
      )}
      <div className="grid grid-cols-2 gap-2 pt-1 sm:grid-cols-3">
        {sources?.map((s) => (
          <div key={s.provider} className="rounded-xl bg-muted/60 p-2.5">
            <p className="text-xs text-muted-foreground">{PROVIDER_LABEL[s.provider]}</p>
            <p className="text-sm font-semibold">
              {s.rating.toFixed(1)} <span className="text-xs font-normal text-muted-foreground">/ {s.ratingScale}</span>
            </p>
            <p className="text-[11px] text-muted-foreground">{s.ratingCount.toLocaleString()} reviews</p>
          </div>
        ))}
      </div>
    </div>
  );
}
