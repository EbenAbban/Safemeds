import { describe, it, expect } from "vitest";
import {
  generateOtp,
  hashOtp,
  verifyOtp,
  normalizeOtp,
  otpExpiry,
  OTP_TTL_MS,
} from "@/lib/otp";

describe("generateOtp", () => {
  it("always produces exactly six digits", () => {
    for (let i = 0; i < 200; i++) {
      expect(generateOtp()).toMatch(/^\d{6}$/);
    }
  });

  it("zero-pads low draws rather than emitting a short code", () => {
    // A naive implementation returns "42" here; the field expects six chars.
    const codes = Array.from({ length: 500 }, generateOtp);
    expect(codes.every((c) => c.length === 6)).toBe(true);
  });

  it("does not repeat itself trivially", () => {
    const codes = new Set(Array.from({ length: 100 }, generateOtp));
    expect(codes.size).toBeGreaterThan(90);
  });
});

describe("hashOtp / verifyOtp", () => {
  it("round-trips the correct code", async () => {
    const otp = "045912";
    expect(await verifyOtp(otp, await hashOtp(otp))).toBe(true);
  });

  it("rejects a wrong code", async () => {
    expect(await verifyOtp("111111", await hashOtp("045912"))).toBe(false);
  });

  it("does not store the code in the clear", async () => {
    expect(await hashOtp("045912")).not.toContain("045912");
  });
});

describe("normalizeOtp", () => {
  it("accepts a plain six-digit code", () => {
    expect(normalizeOtp("045912")).toBe("045912");
  });

  it("strips spaces and dashes users type in", () => {
    expect(normalizeOtp("045 912")).toBe("045912");
    expect(normalizeOtp("045-912")).toBe("045912");
  });

  it("rejects wrong lengths, non-digits and non-strings", () => {
    expect(normalizeOtp("12345")).toBeNull();
    expect(normalizeOtp("1234567")).toBeNull();
    expect(normalizeOtp("abcdef")).toBeNull();
    expect(normalizeOtp(45912)).toBeNull();
    expect(normalizeOtp(null)).toBeNull();
    expect(normalizeOtp(undefined)).toBeNull();
  });
});

describe("otpExpiry", () => {
  it("sits one TTL ahead of the reference time", () => {
    const now = new Date("2026-01-01T00:00:00Z");
    expect(otpExpiry(now).getTime() - now.getTime()).toBe(OTP_TTL_MS);
  });
});
