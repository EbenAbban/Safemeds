// Known campus drop points with real coordinates, used to compute delivery ETA.
//
// Deliveries store a free-text `dropPoint` name (and optionally dropLat/dropLng).
// When only the name is known, resolve it here. Add campus points as needed.

export interface DropPoint {
  name: string;
  lat: number;
  lng: number;
}

// KNUST (Kumasi) campus reference points — adjust to your exact pickup spots.
export const DROP_POINTS: DropPoint[] = [
  { name: "Campus Library - North Entrance", lat: 6.67472, lng: -1.57239 },
  { name: "Student Center Lobby", lat: 6.67610, lng: -1.56960 },
  { name: "Health Services Building", lat: 6.67210, lng: -1.56680 },
  { name: "Main Gate", lat: 6.68130, lng: -1.57360 },
];

// Default when a drop point can't be resolved (KNUST main campus).
export const DEFAULT_DROP: DropPoint = {
  name: "KNUST Campus",
  lat: 6.6745,
  lng: -1.5716,
};

// Resolve coordinates for a delivery: explicit lat/lng win, else match the
// drop-point name (case-insensitive), else fall back to the campus default.
export function resolveDropCoords(
  dropPoint?: string | null,
  lat?: number | null,
  lng?: number | null
): { lat: number; lng: number } {
  if (typeof lat === "number" && typeof lng === "number") return { lat, lng };
  if (dropPoint) {
    const match = DROP_POINTS.find(
      (p) => p.name.toLowerCase() === dropPoint.toLowerCase()
    );
    if (match) return { lat: match.lat, lng: match.lng };
  }
  return { lat: DEFAULT_DROP.lat, lng: DEFAULT_DROP.lng };
}
