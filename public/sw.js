/* SafeMeds service worker.
 *
 * Hand-written on purpose. The only genuinely hard part of a generated worker
 * is precaching Next's content-hashed filenames, and we sidestep that entirely
 * by caching those at runtime instead — they're immutable, so cache-first on
 * first use gives the same repeat-load speed with no build coupling.
 *
 * PRIVACY RULE, load-bearing: authenticated HTML and every /api/ response are
 * fetched network-only and never written to Cache Storage. A naive
 * network-first worker stores every response, which would leave consultation
 * and dashboard markup readable on the device *after sign-out* — on a shared
 * or lost phone that is exactly the disclosure this product exists to prevent.
 * Only public, non-personal assets are cached. Do not "optimise" this away.
 */

const VERSION = "v1";
const STATIC_CACHE = `safemeds-static-${VERSION}`;
const ASSET_CACHE = `safemeds-assets-${VERSION}`;
const PAGE_CACHE = `safemeds-pages-${VERSION}`;
const OFFLINE_URL = "/offline";

const PRECACHE = [
  OFFLINE_URL,
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
];

// Never cached. Mirrors GATED_ROUTES in src/lib/pwa/gated-routes.ts — keep the
// two in step; anything authenticated must appear here.
const PRIVATE_PATHS = [
  "/auth",
  "/signin",
  "/signup",
  "/consult",
  "/consultations",
  "/client-dashboard",
  "/pharmacy-dashboard",
  "/admin",
  "/chat",
  "/inbox",
  "/orders",
  "/settings",
  "/track",
  "/delivery",
  "/deliver",
  "/medications",
  "/prescriptions",
  "/users",
  "/inventory",
  "/analytics",
];

// Public pages safe to keep a copy of for offline reading.
const PUBLIC_PAGES = ["/", "/about", "/contact", "/legal", "/search"];

const isPrivatePath = (pathname) =>
  PRIVATE_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

const isPublicPage = (pathname) =>
  PUBLIC_PAGES.some((p) => pathname === p || (p !== "/" && pathname.startsWith(`${p}/`)));

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
      // A precache miss (a renamed icon, say) must not wedge the worker in a
      // permanently failed install — the app works fine without the cache.
      .catch(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  const keep = new Set([STATIC_CACHE, ASSET_CACHE, PAGE_CACHE]);
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !keep.has(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);
  if (hit) return hit;

  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);

  const network = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => hit);

  return hit || network;
}

async function publicPageStrategy(request) {
  const cache = await caches.open(PAGE_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    return (await cache.match(request)) || (await caches.match(OFFLINE_URL));
  }
}

async function privatePageStrategy(request) {
  try {
    return await fetch(request);
  } catch {
    // Deliberately falls back to the generic offline page rather than a cached
    // copy — see the privacy rule at the top of this file.
    return (await caches.match(OFFLINE_URL)) || Response.error();
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Never touch API traffic, auth callbacks, or the worker's own script.
  if (url.pathname.startsWith("/api/") || url.pathname === "/sw.js") return;

  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/fonts/")) {
    event.respondWith(cacheFirst(request, ASSET_CACHE));
    return;
  }

  if (url.pathname.startsWith("/icons/") || /\.(png|jpg|jpeg|svg|webp|avif|ico)$/i.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(request, ASSET_CACHE));
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(isPrivatePath(url.pathname) || !isPublicPage(url.pathname)
      ? privatePageStrategy(request)
      : publicPageStrategy(request));
  }
});

/* ---------------------------------------------------------------------------
 * Push
 *
 * Payloads carry no medical content — only { kind, link, tag }. The copy shown
 * is fixed and generic, because notifications render on a *locked* screen and
 * a preview naming a symptom or medication would defeat the anonymity this
 * product is built on. Real content is fetched inside the app, after auth.
 * ------------------------------------------------------------------------- */

const NOTIFICATION_COPY = {
  consultation_reply: "You have a new message",
  delivery_update: "There's an update on your delivery",
  order_update: "There's an update on your order",
};

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = {};
  }

  const body = NOTIFICATION_COPY[payload.kind] || "You have a new update";

  event.waitUntil(
    self.registration.showNotification("SafeMeds", {
      body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: payload.tag || payload.kind || "safemeds",
      renotify: true,
      data: { link: typeof payload.link === "string" ? payload.link : "/" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const link = event.notification.data?.link || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      // Reuse an open SafeMeds window if there is one, rather than piling up
      // duplicate app windows every time a notification is tapped.
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(link).catch(() => {});
          return client.focus();
        }
      }
      return self.clients.openWindow(link);
    })
  );
});
