import { describe, it, expect } from "vitest";
import { LEGAL_VERSION, LEGAL_EFFECTIVE_DATE } from "@/lib/legal";

describe("Legal version tracking", () => {
  it("should have a valid semver version", () => {
    expect(LEGAL_VERSION).toMatch(/^\d+\.\d+$/);
  });

  it("should have a readable effective date", () => {
    expect(LEGAL_EFFECTIVE_DATE).toMatch(/^[A-Z][a-z]+ \d{4}$/);
    expect(LEGAL_EFFECTIVE_DATE).toContain("2026");
  });

  it("should have a non-empty version string", () => {
    expect(LEGAL_VERSION.length).toBeGreaterThan(0);
  });
});
