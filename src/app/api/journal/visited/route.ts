import { NextResponse } from "next/server";
import { getVisitedRestaurantOptions } from "@/lib/queries/visited";
import { getCurrentUserId } from "@/lib/auth";

export async function GET() {
  const userId = await getCurrentUserId();
  const restaurants = await getVisitedRestaurantOptions(userId);
  return NextResponse.json({ restaurants });
}
