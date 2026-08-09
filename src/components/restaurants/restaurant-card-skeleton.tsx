import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export function RestaurantCardSkeleton() {
  return (
    <Card className="overflow-hidden py-0 gap-0">
      <Skeleton className="h-40 w-full rounded-none" />
      <div className="space-y-2 p-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex items-center justify-between pt-1">
          <Skeleton className="h-3 w-1/3" />
          <Skeleton className="h-3 w-10" />
        </div>
        <div className="flex gap-1.5 pt-1">
          <Skeleton className="size-7 rounded-full" />
          <Skeleton className="size-7 rounded-full" />
          <Skeleton className="size-7 rounded-full" />
        </div>
      </div>
    </Card>
  );
}

export function RestaurantCardSkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <RestaurantCardSkeleton key={i} />
      ))}
    </div>
  );
}
