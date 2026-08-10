// Routes that prompt mobile users to install the app first.
//
// These are the entry points into authenticated and consultation flows. On iOS
// an installed PWA keeps its own cookie jar, so a session created in Safari is
// invisible inside the installed app — gating sign-in and sign-up means the
// session is created where the student will actually keep using it.
export const GATED_ROUTES = [
  "/auth",
  "/signin",
  "/signup",
  "/consult",
  "/client-dashboard",
  "/pharmacy-dashboard",
  "/admin",
] as const;

/** Strips query string, hash, and any trailing slash (except for the root). */
function normalize(pathname: string): string {
  const path = pathname.split(/[?#]/)[0];
  if (path.length > 1 && path.endsWith("/")) return path.slice(0, -1);
  return path;
}

export function matchesGatedRoute(pathname: string): boolean {
  if (!pathname) return false;
  const path = normalize(pathname);

  // Exact match, or a genuine child segment. The explicit "/" guard is what
  // keeps "/consultations" out of "/consult" — a plain startsWith() would gate
  // unrelated routes that merely share a prefix.
  return GATED_ROUTES.some((route) => path === route || path.startsWith(`${route}/`));
}
