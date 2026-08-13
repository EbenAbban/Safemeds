import bcrypt from "bcrypt";
import { randomInt } from "crypto";

/** How long an issued code stays valid. */
export const OTP_TTL_MS = 10 * 60 * 1000;

/**
 * Wrong guesses tolerated before the code is burned. A 6-digit code has a
 * 1-in-200,000 chance of being hit within this budget, which is the whole
 * reason a short numeric code is acceptable here.
 */
export const OTP_MAX_ATTEMPTS = 5;

const OTP_LENGTH = 6;
const SALT_ROUNDS = 10;

/**
 * A 6-digit code from a CSPRNG. `Math.random` is not acceptable for this —
 * its output is predictable from prior draws.
 */
export function generateOtp(): string {
  return String(randomInt(0, 10 ** OTP_LENGTH)).padStart(OTP_LENGTH, "0");
}

export async function hashOtp(otp: string): Promise<string> {
  return bcrypt.hash(otp, SALT_ROUNDS);
}

export async function verifyOtp(otp: string, hash: string): Promise<boolean> {
  return bcrypt.compare(otp, hash);
}

/** Normalizes user input: strips spaces/dashes people type into the field. */
export function normalizeOtp(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const digits = input.replace(/[\s-]/g, "");
  return /^\d{6}$/.test(digits) ? digits : null;
}

export function otpExpiry(from: Date = new Date()): Date {
  return new Date(from.getTime() + OTP_TTL_MS);
}
