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
  /** Restaurant names actually in Bite Map's data — the model may only "RECOMMENDATION:" one of these. */
  availableRestaurants?: string[];
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

  if (context.availableRestaurants?.length) {
    lines.push(
      `Restaurants you may recommend by name (only these — do not invent or use outside knowledge of other restaurants): ${context.availableRestaurants.join(", ")}.`,
      "When your answer centers on ONE specific restaurant from that list, end your reply on its own new line with exactly: RECOMMENDATION: <restaurant name exactly as listed>. Omit this line if you're not recommending one specific place (e.g. general advice, a list of several options, or answering a question that isn't a recommendation)."
    );
  }

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

interface OpenAIChatCompletion {
  choices?: { message?: { content?: string } }[];
}

/**
 * Sends the conversation to YUU_API_URL, which points at Gary's self-hosted
 * AI platform (~/Projects/ai-platform, api.gariyuuu.com) — an OpenAI-compatible
 * gateway. Wire format confirmed against the platform's own README and the
 * live gariyuuu-web `/api/chat` route: POST `${baseURL}/v1/chat/completions`
 * with `Authorization: Bearer gai_live_...` and a standard OpenAI chat body;
 * responses follow the standard `choices[0].message.content` shape.
 *
 * Throws if YUU isn't configured — callers (the /api/ai-guide/chat route) are
 * responsible for the friendly "connect YUU_API_URL / YUU_API_KEY" fallback
 * shown in the UI.
 */
export async function askYuu(messages: YuuMessage[], context: YuuUserContext): Promise<string> {
  if (!isYuuConfigured()) {
    throw new Error("YUU is not configured. Set YUU_API_URL and YUU_API_KEY.");
  }

  const baseUrl = process.env.YUU_API_URL!.replace(/\/+$/, "");
  const model = process.env.YUU_MODEL || "Yuu no Sekai";

  const res = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.YUU_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "system", content: buildSystemPrompt(context) }, ...messages],
      max_tokens: 500,
    }),
  });

  if (!res.ok) {
    throw new Error(`YUU API error (${res.status})`);
  }

  const data = (await res.json()) as OpenAIChatCompletion;
  return data.choices?.[0]?.message?.content ?? "";
}
