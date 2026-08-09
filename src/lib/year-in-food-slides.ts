import type { YearInFoodStats } from "@/lib/queries/year-in-food";

export interface Slide {
  emoji: string;
  eyebrow: string;
  value: string;
  subtitle?: string;
  gradient: string;
}

const GRADIENTS = [
  "from-rose-500 to-orange-400",
  "from-amber-500 to-yellow-400",
  "from-emerald-500 to-teal-400",
  "from-sky-500 to-cyan-400",
  "from-indigo-500 to-violet-400",
  "from-fuchsia-500 to-pink-400",
  "from-orange-500 to-rose-400",
  "from-teal-500 to-emerald-400",
];

export function buildSlides(stats: YearInFoodStats): Slide[] {
  const slides: Slide[] = [
    {
      emoji: "🍽️",
      eyebrow: `Your ${stats.year} Food Year`,
      value: "Let's look back",
      subtitle: "at everywhere you ate this year",
      gradient: GRADIENTS[0],
    },
  ];

  if (stats.restaurantsVisited > 0) {
    slides.push({
      emoji: "📍",
      eyebrow: "Restaurants Visited",
      value: String(stats.restaurantsVisited),
      subtitle: stats.restaurantsVisited === 1 ? "restaurant" : "restaurants",
      gradient: GRADIENTS[1],
    });
  }

  if (stats.cuisinesTried > 0) {
    slides.push({
      emoji: "🌏",
      eyebrow: "Cuisines Explored",
      value: String(stats.cuisinesTried),
      subtitle: "different cuisines",
      gradient: GRADIENTS[2],
    });
  }

  if (stats.favoriteDish) {
    slides.push({
      emoji: "🥇",
      eyebrow: "Favorite Dish",
      value: stats.favoriteDish.name,
      subtitle: `${stats.favoriteDish.rating}/10 at ${stats.favoriteDish.restaurantName}`,
      gradient: GRADIENTS[3],
    });
  }

  if (stats.mostVisitedRestaurant) {
    slides.push({
      emoji: "🔁",
      eyebrow: "Most Visited Restaurant",
      value: stats.mostVisitedRestaurant.name,
      subtitle: `${stats.mostVisitedRestaurant.visits} visits`,
      gradient: GRADIENTS[4],
    });
  }

  if (stats.highestRatedRestaurant) {
    slides.push({
      emoji: "⭐",
      eyebrow: "Highest Rated",
      value: stats.highestRatedRestaurant.name,
      subtitle: `${stats.highestRatedRestaurant.rating}/10`,
      gradient: GRADIENTS[5],
    });
  }

  if (stats.mostVisitedNeighborhood) {
    slides.push({
      emoji: "🗺️",
      eyebrow: "Most Visited Neighborhood",
      value: stats.mostVisitedNeighborhood.name,
      subtitle: `${stats.mostVisitedNeighborhood.visits} visits`,
      gradient: GRADIENTS[6],
    });
  }

  if (stats.mealsTogether > 0) {
    slides.push({
      emoji: "💕",
      eyebrow: "Meals Together",
      value: String(stats.mealsTogether),
      subtitle: "shared with someone",
      gradient: GRADIENTS[7],
    });
  }

  if (stats.mostExpensiveMeal) {
    slides.push({
      emoji: "💸",
      eyebrow: "Most Expensive Meal",
      value: `$${stats.mostExpensiveMeal.cost.toFixed(0)}`,
      subtitle: stats.mostExpensiveMeal.restaurantName,
      gradient: GRADIENTS[0],
    });
  }

  if (stats.cheapestGreatMeal) {
    slides.push({
      emoji: "💎",
      eyebrow: "Best Value Meal",
      value: `$${stats.cheapestGreatMeal.cost.toFixed(0)}`,
      subtitle: `${stats.cheapestGreatMeal.rating}/10 at ${stats.cheapestGreatMeal.restaurantName}`,
      gradient: GRADIENTS[1],
    });
  }

  if (stats.averageRating != null) {
    slides.push({
      emoji: "📊",
      eyebrow: "Average Rating",
      value: `${stats.averageRating}/10`,
      subtitle: "across every meal you logged",
      gradient: GRADIENTS[2],
    });
  }

  slides.push({
    emoji: "🥢",
    eyebrow: `That was your ${stats.year}`,
    value: "Here's to more great food",
    gradient: GRADIENTS[3],
  });

  return slides;
}
