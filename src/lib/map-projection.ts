export interface GeoBounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

const MIN_SPAN = 0.01; // guards against a degenerate (all-same-point) bounding box

export function computeBounds(points: { latitude: number; longitude: number }[], center: { latitude: number; longitude: number }): GeoBounds {
  const lats = [center.latitude, ...points.map((p) => p.latitude)];
  const lngs = [center.longitude, ...points.map((p) => p.longitude)];

  let minLat = Math.min(...lats);
  let maxLat = Math.max(...lats);
  let minLng = Math.min(...lngs);
  let maxLng = Math.max(...lngs);

  if (maxLat - minLat < MIN_SPAN) {
    const mid = (maxLat + minLat) / 2;
    minLat = mid - MIN_SPAN / 2;
    maxLat = mid + MIN_SPAN / 2;
  }
  if (maxLng - minLng < MIN_SPAN) {
    const mid = (maxLng + minLng) / 2;
    minLng = mid - MIN_SPAN / 2;
    maxLng = mid + MIN_SPAN / 2;
  }

  // 12% padding so edge markers aren't flush against the frame
  const latPad = (maxLat - minLat) * 0.12;
  const lngPad = (maxLng - minLng) * 0.12;

  return {
    minLat: minLat - latPad,
    maxLat: maxLat + latPad,
    minLng: minLng - lngPad,
    maxLng: maxLng + lngPad,
  };
}

/** Projects a lat/lng into a 0-100 percentage position within the map container. */
export function project(lat: number, lng: number, bounds: GeoBounds): { xPct: number; yPct: number } {
  const xPct = ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * 100;
  const yPct = (1 - (lat - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * 100;
  return { xPct, yPct };
}
