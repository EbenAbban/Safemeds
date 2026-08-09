// Browser-side push subscription helpers.

export const PUSH_DECLINED_KEY = "safemeds:push-declined";

/** VAPID keys travel as base64url; PushManager wants raw bytes. */
function urlBase64ToUint8Array(base64Url: string): Uint8Array {
  const padding = "=".repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
}

export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export function hasDeclinedPush(): boolean {
  try {
    return localStorage.getItem(PUSH_DECLINED_KEY) === "1";
  } catch {
    return false;
  }
}

export function rememberPushDecline(): void {
  try {
    localStorage.setItem(PUSH_DECLINED_KEY, "1");
  } catch {
    // Nothing to persist to; we'll simply ask again next session.
  }
}

/**
 * Requests permission and registers a subscription. Must be called from a user
 * gesture — browsers reject drive-by prompts, and iOS requires both a gesture
 * and an installed PWA.
 *
 * Returns true only once the server has stored the subscription.
 */
export async function subscribeToPush(anonymousSessionId?: string): Promise<boolean> {
  if (!isPushSupported()) return false;

  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidKey) return false;

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      if (permission === "denied") rememberPushDecline();
      return false;
    }

    const registration = await navigator.serviceWorker.ready;

    // Reuse an existing subscription when there is one; calling subscribe()
    // twice with a different key throws.
    const existing = await registration.pushManager.getSubscription();
    const subscription =
      existing ??
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
      }));

    const json = subscription.toJSON() as { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return false;

    const response = await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        endpoint: json.endpoint,
        keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
        ...(anonymousSessionId ? { anonymousSessionId } : {}),
      }),
    });

    return response.ok;
  } catch {
    return false;
  }
}

export async function unsubscribeFromPush(): Promise<void> {
  if (!isPushSupported()) return;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return;

    const endpoint = subscription.endpoint;
    await subscription.unsubscribe();
    await fetch("/api/push/unsubscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint }),
    });
  } catch {
    // Best effort — a stale row is pruned server-side on the next 404/410.
  }
}
