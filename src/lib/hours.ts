const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

function parseClock(t: string): number | null {
  const m = t.trim().match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!m) return null;
  let hour = parseInt(m[1], 10);
  const minute = parseInt(m[2], 10);
  const ampm = m[3].toUpperCase();
  if (ampm === "PM" && hour !== 12) hour += 12;
  if (ampm === "AM" && hour === 12) hour = 0;
  return hour * 60 + minute;
}

function todayRange(openingHours: Record<string, string>, now: Date): { open: number; close: number } | null {
  const hours = openingHours[DAY_KEYS[now.getDay()]];
  if (!hours) return null;
  const [openStr, closeStr] = hours.split("-").map((s) => s.trim());
  const open = openStr ? parseClock(openStr) : null;
  const close = closeStr ? parseClock(closeStr) : null;
  if (open == null || close == null) return null;
  return { open, close };
}

export interface OpenStatus {
  isOpen: boolean | null; // null when hours are unknown
  label: string;
}

/** Section 44: OPEN / CLOSING SOON / CLOSED / OPENS AT — handles overnight windows (close < open). */
export function getOpenStatus(openingHours: Record<string, string> | undefined, now = new Date()): OpenStatus {
  if (!openingHours) return { isOpen: null, label: "Hours unknown" };

  const range = todayRange(openingHours, now);
  if (!range) return { isOpen: null, label: "Hours unknown" };

  const nowMin = now.getHours() * 60 + now.getMinutes();
  const overnight = range.close <= range.open;
  const isOpen = overnight ? nowMin >= range.open || nowMin <= range.close : nowMin >= range.open && nowMin <= range.close;

  if (!isOpen) {
    if (nowMin < range.open) {
      const h = Math.floor(range.open / 60);
      const m = range.open % 60;
      const label = new Date(0, 0, 0, h, m).toLocaleTimeString("en-US", { hour: "numeric", minute: m ? "2-digit" : undefined });
      return { isOpen: false, label: `Opens at ${label}` };
    }
    return { isOpen: false, label: "Closed" };
  }

  const closeAbsolute = overnight && nowMin >= range.open ? range.close + 24 * 60 : range.close;
  const minutesToClose = closeAbsolute - nowMin;
  if (minutesToClose <= 60) {
    return { isOpen: true, label: `Closes in ${minutesToClose} min` };
  }
  return { isOpen: true, label: "Open" };
}
