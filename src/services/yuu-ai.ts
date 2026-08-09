/**
 * Abstraction over the YUU AI API (gariyuuu.com's assistant), reused here as
 * Bite Map's food concierge (spec section 14-16). Never import this from a
 * client component — it reads YUU_API_KEY, a server-only secret.
 */
export interface YuuMessage {
  role: "user" | "assistant";
  content: string;
}

export interface YuuUserContext {
  favoriteCuisines?: string[];
  dislikedCuisines?: string[];
  budgetLevel?: string;
  maxTravelMiles?: number;
  locationLabel?: string;
  recentVisits?: { restaurantName: string; cuisines: string[]; overallRating: number | null }[];
  wishlistRestaurantNames?: string[];
}

export function isYuuConfigured(): boolean {
  return Boolean(process.env.YUU_API_URL && process.env.YUU_API_KEY);
}

function buildSystemPrompt(context: YuuUserContext): string {
  const lines = [
    "You are YUU, the AI food concierge inside Bite Map, a personal restaurant-tracking and food-journal app.",
    "Answer like a well-traveled local friend who knows the user's taste: concise, specific restaurant/dish recommendations, not generic advice.",
    "Prefer restaurants the user hasn't visited yet unless they ask to revisit somewhere. Always mention 1-2 specific dishes to order when recommending a restaurant.",
  ];

  if (context.favoriteCuisines?.length) lines.push(`Favorite cuisines: ${context.favoriteCuisines.join(", ")}.`);
  if (context.dislikedCuisines?.length) lines.push(`Avoid recommending: ${context.dislikedCuisines.join(", ")}.`);
  if (context.budgetLevel) lines.push(`Typical budget: ${context.budgetLevel}.`);
  if (context.maxTravelMiles) lines.push(`Willing to travel up to ${context.maxTravelMiles} miles.`);
  if (context.locationLabel) lines.push(`Currently near: ${context.locationLabel}.`);
  if (context.recentVisits?.length) {
    lines.push(
      "Recent visits: " +
        context.recentVisits
          .slice(0, 8)
          .map((v) => `${v.restaurantName} (${v.cuisines[0] ?? "?"}${v.overallRating != null ? `, rated ${v.overallRating}/10` : ""})`)
          .join("; ") +
        "."
    );
  }
  if (context.wishlistRestaurantNames?.length) {
    lines.push(`On their wishlist already: ${context.wishlistRestaurantNames.slice(0, 10).join(", ")}.`);
  }

  return lines.join(" ");
}

/**
 * Sends the conversation to the YUU API. Throws if YUU isn't configured —
 * callers (the /api/ai-guide/chat route) are responsible for the friendly
 * "connect YUU_API_URL / YUU_API_KEY" fallback shown in the UI.
 */
export async function askYuu(messages: YuuMessage[], context: YuuUserContext): Promise<string> {
  if (!isYuuConfigured()) {
    throw new Error("YUU is not configured. Set YUU_API_URL and YUU_API_KEY.");
  }

  const res = await fetch(`${process.env.YUU_API_URL}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.YUU_API_KEY}`,
    },
    body: JSON.stringify({
      messages: [{ role: "system", content: buildSystemPrompt(context) }, ...messages],
    }),
  });

  if (!res.ok) {
    throw new Error(`YUU API error (${res.status})`);
  }

  const data = await res.json();
  return data.reply ?? data.message ?? data.content ?? "";
}
