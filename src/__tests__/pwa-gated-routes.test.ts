import { describe, it, expect } from "vitest";
import { matchesGatedRoute, GATED_ROUTES } from "@/lib/pwa/gated-routes";

describe("matchesGatedRoute", () => {
  it("matches every declared gated route exactly", () => {
    for (const route of GATED_ROUTES) {
      expect(matchesGatedRoute(route)).toBe(true);
    }
  });

  it("matches nested paths under a gated route", () => {
    expect(matchesGatedRoute("/consult/new")).toBe(true);
    expect(matchesGatedRoute("/admin/users")).toBe(true);
    expect(matchesGatedRoute("/client-dashboard/orders/123")).toBe(true);
  });

  // The landing page and marketing pages must stay reachable — a greedy
  // prefix match here would silently gate the entire site.
  it("does not match public routes", () => {
    expect(matchesGatedRoute("/")).toBe(false);
    expect(matchesGatedRoute("/about")).toBe(false);
    expect(matchesGatedRoute("/contact")).toBe(false);
    expect(matchesGatedRoute("/legal")).toBe(false);
    expect(matchesGatedRoute("/track")).toBe(false);
  });

  // "/consultations" shares a prefix with the gated "/consult" but is a
  // different route. A naive startsWith() would gate it by accident.
  it("does not match routes that merely share a prefix", () => {
    expect(matchesGatedRoute("/consultations")).toBe(false);
    expect(matchesGatedRoute("/consultations/abc")).toBe(false);
    expect(matchesGatedRoute("/signup-complete")).toBe(false);
    expect(matchesGatedRoute("/adminstrivia")).toBe(false);
  });

  it("ignores trailing slashes and query strings", () => {
    expect(matchesGatedRoute("/consult/")).toBe(true);
    expect(matchesGatedRoute("/about/")).toBe(false);
  });
});
