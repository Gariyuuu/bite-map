"use client";

import { LocationProvider } from "@/components/shared/location-provider";
import { LocationConsentDialog } from "@/components/shared/location-consent-dialog";
import { DesktopNav } from "./desktop-nav";
import { MobileHeader } from "./mobile-header";
import { MobileNav } from "./mobile-nav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <LocationProvider>
      <DesktopNav />
      <MobileHeader />
      <main className="flex-1 pb-24 md:pb-6">{children}</main>
      <MobileNav />
      <LocationConsentDialog />
    </LocationProvider>
  );
}
