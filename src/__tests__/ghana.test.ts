import { describe, it, expect } from "vitest";
import {
  normalizeGhanaPhone,
  isValidGhanaPhone,
  GHANA_REGIONS,
} from "@/lib/ghana";

/**
 * The rule this replaced was `/^[\+]?[1-9][\d]{0,15}$/`, which required the
 * first digit to be 1-9. Every Ghanaian local number begins with 0, so the
 * signup form rejected the way people actually write their own numbers and
 * silently demanded +233.
 */
describe("normalizeGhanaPhone", () => {
  it.each([
    ["0546132427", "+233546132427"],
    ["0543883467", "+233543883467"],
    ["0200000001", "+233200000001"],
  ])("accepts the local form %s", (input, expected) => {
    expect(normalizeGhanaPhone(input)).toBe(expected);
  });

  it.each([
    ["+233546132427", "+233546132427"],
    ["233546132427", "+233546132427"],
  ])("accepts the international form %s", (input, expected) => {
    expect(normalizeGhanaPhone(input)).toBe(expected);
  });

  it.each(["054 613 2427", "054-613-2427", "+233 54 613 2427", "(054) 613-2427"])(
    "ignores separators in %s",
    (input) => {
      expect(normalizeGhanaPhone(input)).toBe("+233546132427");
    }
  );

  it("normalises every accepted spelling to one stored value", () => {
    const forms = ["0546132427", "+233546132427", "233546132427", "054 613 2427"];
    expect(new Set(forms.map(normalizeGhanaPhone)).size).toBe(1);
  });

  it.each([
    ["054613242", "one digit short"],
    ["05461324277", "one digit long"],
    ["12345", "far too short"],
    ["abcdefghij", "not numeric"],
    ["", "empty"],
    ["+1546132427", "wrong country code"],
  ])("rejects %s (%s)", (input) => {
    expect(normalizeGhanaPhone(input)).toBeNull();
    expect(isValidGhanaPhone(input)).toBe(false);
  });
});

describe("GHANA_REGIONS", () => {
  it("lists all sixteen regions", () => {
    expect(GHANA_REGIONS).toHaveLength(16);
  });

  it("uses the post-2018 names, not the old ten", () => {
    expect(GHANA_REGIONS).toContain("Bono East");
    expect(GHANA_REGIONS).toContain("Western North");
    expect(GHANA_REGIONS).not.toContain("Brong Ahafo");
  });

  it("has no duplicates", () => {
    expect(new Set(GHANA_REGIONS).size).toBe(GHANA_REGIONS.length);
  });
});
