// Real-time delivery GPS tracking over the app's own Postgres-backed API.
//
// The courier (pharmacist/runner) opens /deliver/[deliveryId] on a phone and
// streams the device's real geolocation here (POST); the student's delivery
// page subscribes by polling (GET) and sees the live position. No Firebase or
// Google Maps key needed — the map is rendered with OpenStreetMap's embed.
//
//   POST /api/delivery/[id]/location   -> publish a fix
//   GET  /api/delivery/[id]/location   -> read the latest fix

export interface CourierLocation {
  lat: number;
  lng: number;
  accuracy: number | null; // metres, from the GPS device
  heading: number | null; // degrees
  speed: number | null; // m/s
  updatedAt: number; // epoch ms
  active: boolean; // false when the courier stops sharing
}

const POLL_INTERVAL_MS = 3000;

function locationUrl(deliveryId: string): string {
  return `/api/delivery/${encodeURIComponent(deliveryId)}/location`;
}

// Courier side: push one position fix.
export async function publishLocation(
  deliveryId: string,
  pos: GeolocationPosition,
  active = true
): Promise<void> {
  await fetch(locationUrl(deliveryId), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      accuracy: pos.coords.accuracy ?? null,
      heading: pos.coords.heading ?? null,
      speed: pos.coords.speed ?? null,
      active,
    }),
  });
}

// Courier side: mark the session ended (keeps last position, flips active off).
export async function stopSharing(deliveryId: string): Promise<void> {
  await fetch(locationUrl(deliveryId), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ active: false }),
  });
}

// Student side: subscribe to live position via polling. Returns an unsubscribe fn.
export function watchLocation(
  deliveryId: string,
  onUpdate: (loc: CourierLocation | null) => void
): () => void {
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const poll = async () => {
    try {
      const res = await fetch(locationUrl(deliveryId), { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        onUpdate((data?.location as CourierLocation | null) ?? null);
      } else {
        onUpdate(null);
      }
    } catch {
      onUpdate(null);
    } finally {
      if (!stopped) timer = setTimeout(poll, POLL_INTERVAL_MS);
    }
  };

  poll();

  return () => {
    stopped = true;
    if (timer) clearTimeout(timer);
  };
}
