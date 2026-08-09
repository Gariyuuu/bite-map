/**
 * Google's documented no-API-key "search" deep link — works for any real
 * place and, just as usefully, makes it obvious when a place doesn't exist:
 * a fabricated demo restaurant returns no results instead of a real listing.
 */
export function googleMapsSearchUrl(name: string, address?: string): string {
  const query = [name, address].filter(Boolean).join(" ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
