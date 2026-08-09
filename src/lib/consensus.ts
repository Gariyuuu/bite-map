import type { ConsensusConfidence, ConsensusResult, ProviderId } from "@/types/restaurant";

export interface ConsensusInput {
  provider: ProviderId;
  rating: number; // native scale
  ratingScale: number; // e.g. 5, 10, or 100
  ratingCount: number;
}

/**
 * BiteMap Consensus Score (spec section 9).
 *
 * Naive averaging lets a restaurant with five 5-star reviews outrank one with
 * thousands of 4.5-star reviews, which is wrong. Instead:
 *
 *  1. Normalize each platform's rating onto a 0-100 scale.
 *  2. Apply Bayesian shrinkage per source: pull low-volume ratings toward a
 *     neutral prior (70/100) proportional to how few reviews back them —
 *     the m-estimate, with m = SHRINKAGE_REVIEWS "phantom" reviews at the
 *     prior. A 5-review 5.0 restaurant shrinks hard; a 3,000-review 4.6
 *     restaurant barely moves.
 *  3. Combine sources weighted by confidence = log(1 + reviewCount), so
 *     high-volume platforms dominate the blend without a single-source veto.
 */
const PRIOR_SCORE = 70;
const SHRINKAGE_REVIEWS = 25;

function toHundredScale(rating: number, scale: number): number {
  return Math.max(0, Math.min(100, (rating / scale) * 100));
}

function shrink(score: number, count: number): number {
  return (score * count + PRIOR_SCORE * SHRINKAGE_REVIEWS) / (count + SHRINKAGE_REVIEWS);
}

function confidenceLabel(totalReviews: number): ConsensusConfidence {
  if (totalReviews >= 1500) return "very_high";
  if (totalReviews >= 300) return "high";
  if (totalReviews >= 50) return "medium";
  return "low";
}

export function computeConsensus(inputs: ConsensusInput[]): ConsensusResult | null {
  const valid = inputs.filter((i) => i.rating != null && i.ratingCount != null && i.ratingCount >= 0);
  if (valid.length === 0) return null;

  let weightedSum = 0;
  let weightTotal = 0;
  const sources: ConsensusResult["sources"] = [];

  for (const input of valid) {
    const normalized = toHundredScale(input.rating, input.ratingScale);
    const shrunk = shrink(normalized, input.ratingCount);
    const confidence = Math.log(1 + input.ratingCount);

    weightedSum += shrunk * confidence;
    weightTotal += confidence;

    sources.push({
      provider: input.provider,
      normalizedScore: Math.round(normalized * 10) / 10,
      rating: input.rating,
      ratingScale: input.ratingScale,
      ratingCount: input.ratingCount,
    });
  }

  const totalReviews = valid.reduce((sum, i) => sum + i.ratingCount, 0);
  const score = weightTotal > 0 ? weightedSum / weightTotal : PRIOR_SCORE;

  return {
    score: Math.round(score),
    confidence: confidenceLabel(totalReviews),
    totalReviews,
    sources,
  };
}
