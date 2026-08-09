import { Show, UserButton } from "@clerk/nextjs";
import { CLERK_ENABLED } from "@/lib/env";
import { Button } from "@/components/ui/button";
import Link from "next/link";

/**
 * Renders real Clerk auth UI when configured, otherwise a "Demo Mode" badge.
 * CLERK_ENABLED is a build-time-stable check (NEXT_PUBLIC_ var); when it's
 * false, <Show> is never mounted at all.
 */
export function AuthButtons() {
  if (!CLERK_ENABLED) {
    return (
      <div className="flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 text-xs text-muted-foreground">
        Demo Mode
      </div>
    );
  }

  return (
    <>
      <Show when="signed-in">
        <UserButton />
      </Show>
      <Show when="signed-out">
        <Button render={<Link href="/sign-in" />} nativeButton={false} size="sm">
          Sign in
        </Button>
      </Show>
    </>
  );
}
