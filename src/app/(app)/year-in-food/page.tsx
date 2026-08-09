import { getCurrentUserId } from "@/lib/auth";
import { getYearInFoodStats } from "@/lib/queries/year-in-food";
import { buildSlides } from "@/lib/year-in-food-slides";
import { SlidePresentation } from "@/components/year-in-food/slide-presentation";
import { DATABASE_ENABLED } from "@/db";
import Link from "next/link";

export default async function YearInFoodPage({ searchParams }: { searchParams: Promise<{ year?: string }> }) {
  const { year: yearParam } = await searchParams;
  const year = yearParam ? Number(yearParam) : new Date().getFullYear();
  const userId = await getCurrentUserId();
  const stats = DATABASE_ENABLED ? await getYearInFoodStats(userId, year) : null;

  if (!stats?.hasData) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-3 p-6 text-center">
        <span className="text-4xl">🍽️</span>
        <h1 className="text-xl font-semibold">No food year to look back on yet</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          {DATABASE_ENABLED
            ? `Log a few visits in ${year} and come back — Year in Food builds itself from your real history.`
            : "Connect DATABASE_URL and log some visits to unlock Year in Food."}
        </p>
        <Link href="/profile" className="text-sm font-medium text-accent underline">
          Back to Profile
        </Link>
      </div>
    );
  }

  const slides = buildSlides(stats);
  return <SlidePresentation slides={slides} />;
}
