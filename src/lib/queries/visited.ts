import { db, DATABASE_ENABLED, restaurantUserStatus, restaurants, safeQuery } from "@/db";
import { eq, and, gt } from "drizzle-orm";

export interface VisitedRestaurantOption {
  id: string;
  name: string;
  heroPhotoUrl: string | null;
  cuisines: string[];
}

/** Powers the photo journal's restaurant/photo picker — only places the user has actually been. */
export async function getVisitedRestaurantOptions(userId: string): Promise<VisitedRestaurantOption[]> {
  if (!DATABASE_ENABLED) return [];
  return safeQuery(async () => {
    const rows = await db!
      .select({ restaurant: restaurants })
      .from(restaurantUserStatus)
      .leftJoin(restaurants, eq(restaurantUserStatus.restaurantId, restaurants.id))
      .where(and(eq(restaurantUserStatus.userId, userId), gt(restaurantUserStatus.visitCount, 0)));

    return rows
      .filter((r): r is { restaurant: NonNullable<typeof r.restaurant> } => r.restaurant !== null)
      .map(({ restaurant }) => ({
        id: restaurant.id,
        name: restaurant.name,
        heroPhotoUrl: restaurant.heroPhotoUrl,
        cuisines: restaurant.cuisines,
      }));
  }, []);
}
