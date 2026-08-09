import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/shared/theme-provider";
import { PaletteProvider } from "@/components/shared/palette-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CLERK_ENABLED } from "@/lib/env";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bite Map — Your Food Exploration OS",
  description:
    "Discover restaurants, track everywhere you've eaten, and journal food memories with the people you eat with.",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fefefe" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <PaletteProvider>
        <TooltipProvider delay={200}>
          {children}
          <Toaster />
        </TooltipProvider>
      </PaletteProvider>
    </ThemeProvider>
  );
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  const body = (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  );

  if (!CLERK_ENABLED) return body;

  return <ClerkProvider>{body}</ClerkProvider>;
}
