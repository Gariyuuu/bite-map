import { SignIn } from "@clerk/nextjs";
import { CLERK_ENABLED } from "@/lib/env";
import Link from "next/link";

export default function SignInPage() {
  if (!CLERK_ENABLED) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
        <h1 className="text-xl font-semibold">Sign-in isn&apos;t configured yet</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY to enable real accounts. Until
          then, Bite Map runs in Demo Mode for the seeded &quot;You&quot; account.
        </p>
        <Link href="/" className="text-sm font-medium text-accent underline">
          Back to Bite Map
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <SignIn />
    </div>
  );
}
