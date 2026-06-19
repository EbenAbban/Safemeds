import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "@/utils/password";

describe("password utils", () => {
  it("should hash and verify a password", async () => {
    const password = "test-password-123";
    const hash = await hashPassword(password);
    expect(hash).toBeDefined();
    expect(hash).not.toBe(password);
    const isValid = await verifyPassword(password, hash);
    expect(isValid).toBe(true);
  });

  it("should reject wrong password", async () => {
    const hash = await hashPassword("correct-password");
    const isValid = await verifyPassword("wrong-password", hash);
    expect(isValid).toBe(false);
  });

  it("should produce different hashes for the same password", async () => {
    const password = "same-password";
    const hash1 = await hashPassword(password);
    const hash2 = await hashPassword(password);
    expect(hash1).not.toBe(hash2);
  });

  it("should reject empty password verification", async () => {
    const hash = await hashPassword("real-password");
    const isValid = await verifyPassword("", hash);
    expect(isValid).toBe(false);
  });

  it("should handle special characters in passwords", async () => {
    const password = "P@ssw0rd!@#$%^&*()_+-=[]{}|;':\",./<>?`~";
    const hash = await hashPassword(password);
    const isValid = await verifyPassword(password, hash);
    expect(isValid).toBe(true);
  });
});
