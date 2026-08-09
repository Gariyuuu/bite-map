import { NextResponse, type NextRequest } from "next/server";
import { getNearbyRestaurants } from "@/lib/queries/restaurants";
import { getCurrentUserId } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const latitude = Number(params.get("lat"));
  const longitude = Number(params.get("lng"));

  if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
    return NextResponse.json({ error: "lat and lng are required" }, { status: 400 });
  }

  const radiusMiles = Number(params.get("radius") ?? 10);
  const query = params.get("q") ?? undefined;
  const cuisinesParam = params.get("cuisines");
  const cuisines = cuisinesParam ? cuisinesParam.split(",") : undefined;
  const userId = await getCurrentUserId();

  const restaurants = await getNearbyRestaurants({
    latitude,
    longitude,
    radiusMiles,
    query,
    cuisines,
    userId,
    limit: 120,
  });

  return NextResponse.json({ restaurants });
}
