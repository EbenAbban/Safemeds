import { describe, it, expect } from "vitest";
import { isPublicRoute, PUBLIC_ROUTES } from "@/lib/routes";

describe("isPublicRoute", () => {
  it("matches every declared public route", () => {
    for (const route of PUBLIC_ROUTES) {
      expect(isPublicRoute(route)).toBe(true);
    }
  });

  // The regression this module exists to prevent: these pages call useAuth, and
  // used to bounce signed-out visitors to /auth despite middleware serving them.
  it.each(["/about", "/contact", "/legal", "/search", "/track", "/consult"])(
    "keeps %s readable when signed out",
    (path) => {
      expect(isPublicRoute(path)).toBe(true);
    }
  );

  it("treats nested paths under a public route as public", () => {
    expect(isPublicRoute("/legal/privacy")).toBe(true);
    expect(isPublicRoute("/consult/new")).toBe(true);
    expect(isPublicRoute("/delivery/abc123")).toBe(true);
  });

  it("keeps authenticated areas private", () => {
    for (const path of [
      "/client-dashboard",
      "/pharmacy-dashboard",
      "/admin",
      "/admin/users",
      "/orders",
      "/inbox",
      "/settings",
      "/medications",
    ]) {
      expect(isPublicRoute(path)).toBe(false);
    }
  });

  // /chat was moved out of the private list deliberately, not incidentally.
  //
  // An anonymous student has no account by design, and must still be able to
  // read the pharmacist's reply to the consultation they just submitted —
  // both at /chat and at /chat/<consultationId> when following a link from
  // /track or a notification.
  //
  // This is safe because the page holds no data of its own. Every message is
  // fetched from /api/chat/consultation/[consultationId], which authorises on
  // session *or* anonymousId and returns 401 with neither. The API is the
  // boundary, exactly as it is for /track. Making the route reachable does not
  // make any consultation readable.
  it("treats the consultation chat as public so anonymous students can reach it", () => {
    expect(isPublicRoute("/chat")).toBe(true);
    expect(isPublicRoute("/chat/42")).toBe(true);
  });

  // The single most dangerous bug this file could have: if "/" were treated as
  // a prefix, every route on the site would become public.
  it("does not let the root route make everything public", () => {
    expect(isPublicRoute("/admin")).toBe(false);
    expect(isPublicRoute("/client-dashboard")).toBe(false);
  });

  it("does not match routes that merely share a prefix", () => {
    expect(isPublicRoute("/aboutus")).toBe(false);
    expect(isPublicRoute("/consultations")).toBe(false);
    expect(isPublicRoute("/verify-license")).toBe(false);
  });

  it("ignores trailing slashes, query strings, and hashes", () => {
    expect(isPublicRoute("/about/")).toBe(true);
    expect(isPublicRoute("/track?sessionId=abc")).toBe(true);
    expect(isPublicRoute("/legal#terms")).toBe(true);
    expect(isPublicRoute("/admin/")).toBe(false);
  });

  it("fails open on an empty path rather than redirecting", () => {
    expect(isPublicRoute("")).toBe(true);
  });
});
