import type { LucideIcon } from "lucide-react";
import { Map, Compass, BookHeart, Images, LayoutGrid, Sparkles, User } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  mobile?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/map", label: "Map", icon: Map, mobile: true },
  { href: "/discover", label: "Discover", icon: Compass, mobile: true },
  { href: "/journal", label: "Journal", icon: BookHeart, mobile: true },
  { href: "/photo-journal", label: "Photo Journal", icon: Images, mobile: true },
  { href: "/collections", label: "Collections", icon: LayoutGrid },
  { href: "/ai-guide", label: "AI Guide", icon: Sparkles },
  { href: "/profile", label: "Profile", icon: User, mobile: true },
];
