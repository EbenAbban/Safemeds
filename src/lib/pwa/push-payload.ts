// Builds the payload that goes over the wire to a push endpoint.
//
// Push notifications render on a LOCKED screen. For an anonymous student
// health service, a lock-screen preview naming a symptom, a medication, or a
// pharmacist would defeat the anonymity the whole product is built on. So the
// wire payload is a strict whitelist of three non-identifying fields, and the
// notification copy itself is fixed text chosen by the service worker from
// `kind`. Real content is only ever fetched inside the app, after auth.
//
// This module is pure so the guarantee is unit-testable.

export type PushKind = "consultation_reply" | "delivery_update" | "order_update";

export const PUSH_WIRE_KEYS = ["kind", "link", "tag"] as const;

export interface PushIntent {
  kind: PushKind;
  /** Same-origin path to open when the notification is tapped. */
  link: string;
  /** Collapses repeat alerts about the same thing. Defaults to `kind`. */
  tag?: string;
}

export interface PushWirePayload {
  kind: PushKind;
  link: string;
  tag: string;
}

/**
 * Only same-origin absolute paths survive. A notification tap calls
 * openWindow(), so an attacker-supplied absolute URL here would be an open
 * redirect fired straight from a lock screen.
 */
function sanitizeLink(link: unknown): string {
  if (typeof link !== "string" || link.length === 0) return "/";
  // Must start with a single slash: "//host" is protocol-relative and
  // "javascript:" / "https:" are off-origin.
  if (!link.startsWith("/") || link.startsWith("//")) return "/";
  return link;
}

export function buildPushPayload(intent: PushIntent): PushWirePayload {
  // Destructured explicitly rather than spread — a spread would silently carry
  // through any extra field a caller attached, which is exactly the leak this
  // module exists to prevent.
  const { kind, link, tag } = intent;

  return {
    kind,
    link: sanitizeLink(link),
    tag: typeof tag === "string" && tag.length > 0 ? tag : kind,
  };
}
