// Real-time delivery GPS tracking over Firestore.
//
// The courier (pharmacist/runner) opens /deliver/[deliveryId] on a phone and
// streams the device's real geolocation here; the student's delivery page
// subscribes and sees the live position. No Google Maps key needed — the map
// is rendered with OpenStreetMap's embed.
//
// Doc: deliveryLocations/{deliveryId} -> { lat, lng, accuracy, heading, speed, updatedAt, active }

import { doc, setDoc, onSnapshot } from "firebase/firestore";
import { db, ensureAuth } from "./firebase";

export interface CourierLocation {
  lat: number;
  lng: number;
  accuracy: number | null; // metres, from the GPS device
  heading: number | null; // degrees
  speed: number | null; // m/s
  updatedAt: number; // epoch ms
  active: boolean; // false when the courier stops sharing
}

// Courier side: push one position fix.
export async function publishLocation(
  deliveryId: string,
  pos: GeolocationPosition,
  active = true
): Promise<void> {
  await ensureAuth();
  const ref = doc(db, "deliveryLocations", deliveryId);
  await setDoc(
    ref,
    {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      accuracy: pos.coords.accuracy ?? null,
      heading: pos.coords.heading ?? null,
      speed: pos.coords.speed ?? null,
      updatedAt: Date.now(),
      active,
    },
    { merge: true }
  );
}

// Courier side: mark the session ended (keeps last position, flips active off).
export async function stopSharing(deliveryId: string): Promise<void> {
  await ensureAuth();
  const ref = doc(db, "deliveryLocations", deliveryId);
  await setDoc(ref, { active: false, updatedAt: Date.now() }, { merge: true });
}

// Student side: subscribe to live position. Returns an unsubscribe fn.
export function watchLocation(
  deliveryId: string,
  onUpdate: (loc: CourierLocation | null) => void
): () => void {
  let unsub = () => {};
  let cancelled = false;
  ensureAuth()
    .then(() => {
      if (cancelled) return;
      const ref = doc(db, "deliveryLocations", deliveryId);
      unsub = onSnapshot(ref, (snap) => {
        onUpdate(snap.exists() ? (snap.data() as CourierLocation) : null);
      });
    })
    .catch((e) => console.error("location auth failed:", e));
  return () => {
    cancelled = true;
    unsub();
  };
}
