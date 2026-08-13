// Single source of truth for which routes are reachable without a session.
//
// This list previously lived only inside middleware.ts, while useAuth kept its
// own much shorter idea of what counted as public. The two disagreed, so any
// public page that called useAuth (/about, /contact, /legal) bounced signed-out
// visitors to /auth even though the middleware happily served them. Both now
// import from here.

export const PUBLIC_ROUTES = [
  "/",
  "/auth",
  "/signin",
  "/signup",
  "/verify",
  "/about",
  "/contact",
  "/search",
  "/legal",
  "/consult",
  "/track",
  // An anonymous student must be able to read the pharmacist's reply to the
  // consultation they just submitted, and by design they have no account. The
  // page holds no data of its own: every message comes from
  // /api/chat/consultation/[id], which authorises on session *or* anonymousId
  // and 401s without either. The API is the real boundary, as it is for /track.
  //
  // This does not widen caching. sw.js lists /chat in its never-cached set and
  // GATED_ROUTES still applies the PWA install gate — auth-public, PWA-gated,
  // never-cached, the same combination /consult already uses.
  "/chat",
  "/delivery",
  // Precached by the service worker as the offline fallback. An offline user
  // cannot complete a sign-in redirect, so this must never be gated.
  "/offline",
] as const;

/** Strips query string, hash, and any trailing slash (except for the root). */
function normalize(pathname: string): string {
  const path = pathname.split(/[?#]/)[0];
  if (path.length > 1 && path.endsWith("/")) return path.slice(0, -1);
  return path;
}

export function isPublicRoute(pathname: string): boolean {
  // An unknown path is treated as public here; the server-side middleware is
  // the real boundary, so failing open costs nothing and avoids trapping
  // someone behind a client-side redirect loop.
  if (!pathname) return true;

  const path = normalize(pathname);

  return PUBLIC_ROUTES.some((route) => {
    if (path === route) return true;
    // "/" must match exactly — treating it as a prefix would make every route
    // on the site public.
    if (route === "/") return false;
    return path.startsWith(`${route}/`);
  });
}
