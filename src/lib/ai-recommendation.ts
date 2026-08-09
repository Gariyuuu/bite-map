import { findRestaurantCardByName, type AiRecommendationCard } from "@/lib/queries/restaurant-lookup";

export interface AssistantResponse {
  reply: string;
  card: AiRecommendationCard | null;
}

// Matches a trailing "RECOMMENDATION: <name>" line the system prompt asks YUU
// to append whenever it's pointing at one specific restaurant.
const RECOMMENDATION_RE = /\n?RECOMMENDATION:\s*(.+?)\s*$/i;

export function parseRecommendation(rawText: string): { text: string; restaurantName: string | null } {
  const trimmed = rawText.trim();
  const match = trimmed.match(RECOMMENDATION_RE);
  if (!match) return { text: trimmed, restaurantName: null };
  return { text: trimmed.slice(0, match.index).trim(), restaurantName: match[1].trim() };
}

/**
 * Turns a raw YUU completion into { reply, card }. We never trust the model
 * for structured data (scores, dishes) — it only tells us which restaurant
 * it means, and we look up everything else from our own database. This is
 * what makes the response cards possible (spec section 16) without risking
 * a hallucinated consensus score.
 */
export async function buildAssistantResponse(rawText: string): Promise<AssistantResponse> {
  const { text, restaurantName } = parseRecommendation(rawText);
  const card = restaurantName ? await findRestaurantCardByName(restaurantName) : null;
  return { reply: text, card };
}
