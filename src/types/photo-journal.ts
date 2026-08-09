export type BoardElementType = "photo" | "caption" | "restaurant-card" | "date-stamp";

interface BoardElementBase {
  id: string;
  type: BoardElementType;
  /** All position/size values are 0-100 (percent of board width/height) so the board stays responsive. */
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  z: number;
}

export interface PhotoElement extends BoardElementBase {
  type: "photo";
  photoUrl: string;
  caption?: string;
}

export interface CaptionElement extends BoardElementBase {
  type: "caption";
  text: string;
}

export interface RestaurantCardElement extends BoardElementBase {
  type: "restaurant-card";
  restaurantId: string;
  restaurantName: string;
  photoUrl?: string;
  cuisine?: string;
}

export interface DateStampElement extends BoardElementBase {
  type: "date-stamp";
  date: string; // ISO date
}

export type BoardElement = PhotoElement | CaptionElement | RestaurantCardElement | DateStampElement;

export const BOARD_WIDTH = 900;
export const BOARD_HEIGHT = 1200;

export const PHOTO_JOURNAL_TEMPLATES = [
  "Date Night",
  "Food Crawl",
  "Weekend Eats",
  "Ramen Tour",
  "Café Tour",
  "Dessert Day",
  "Birthday Dinner",
  "Michelin Night",
  "Asian Food Tour",
  "Month in Food",
  "Year in Food",
] as const;
