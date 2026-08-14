import { describe, it, expect } from "vitest";
import { formatCurrency } from "@/lib/currency";

/**
 * Regression: Medication.price is a Prisma Decimal, which arrives over JSON as
 * a string. medicationService typed it `number`, so `price.toFixed(2)` passed
 * the compiler and threw "toFixed is not a function" at runtime, taking the
 * medications page down to the error boundary for every pharmacist.
 */
describe("formatCurrency", () => {
  it("formats the string a Decimal column actually serialises to", () => {
    expect(formatCurrency("5")).toContain("5.00");
    expect(formatCurrency("12.5")).toContain("12.50");
  });

  it("formats a real number the same way", () => {
    expect(formatCurrency(5)).toBe(formatCurrency("5"));
  });

  it("uses Ghana cedis, not dollars", () => {
    const out = formatCurrency(5);
    expect(out).toMatch(/(GH₵|₵|GHS)/);
    expect(out).not.toContain("$");
  });

  it("always shows two decimal places", () => {
    expect(formatCurrency(5)).toContain("5.00");
    expect(formatCurrency("0")).toContain("0.00");
  });

  it.each([null, undefined, "", "not a number", NaN, Infinity])(
    "renders %s as zero rather than throwing or printing NaN",
    (input) => {
      const out = formatCurrency(input);
      expect(out).toContain("0.00");
      expect(out).not.toContain("NaN");
    }
  );

  it("never throws on a value the API might send", () => {
    for (const v of [{}, [], true, 0, -3.5, "1e3"]) {
      expect(() => formatCurrency(v)).not.toThrow();
    }
  });
});
