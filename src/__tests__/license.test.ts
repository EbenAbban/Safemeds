import { describe, it, expect } from "vitest";
import {
  validateLicenseFormat,
  formatLicenseNumber,
} from "@/services/licenseService";

describe("License Service - validateLicenseFormat", () => {
  it("should accept valid license format (PH123456)", () => {
    expect(validateLicenseFormat("PH123456")).toBe(true);
  });

  it("should accept license with different state code (NY789012)", () => {
    expect(validateLicenseFormat("NY789012")).toBe(true);
  });

  it("should reject license with wrong letter count (ABC123456)", () => {
    expect(validateLicenseFormat("ABC123456")).toBe(false);
  });

  it("should reject license with wrong digit count (PH12345)", () => {
    expect(validateLicenseFormat("PH12345")).toBe(false);
  });

  it("should reject empty string", () => {
    expect(validateLicenseFormat("")).toBe(false);
  });

  it("should reject lowercase (should be uppercase)", () => {
    expect(validateLicenseFormat("ph123456")).toBe(false);
  });

  it("should reject alphanumeric mix in wrong places", () => {
    expect(validateLicenseFormat("P1H23456")).toBe(false);
  });
});

describe("License Service - formatLicenseNumber", () => {
  it("should format a clean license number", () => {
    expect(formatLicenseNumber("PH123456")).toBe("PH123456");
  });

  it("should strip non-alphanumeric characters", () => {
    expect(formatLicenseNumber("PH-123-456")).toBe("PH123456");
  });

  it("should convert to uppercase", () => {
    expect(formatLicenseNumber("ph123456")).toBe("PH123456");
  });

  it("should handle extra characters beyond 8", () => {
    expect(formatLicenseNumber("PH12345678")).toBe("PH123456");
  });

  it("should handle mixed formatting", () => {
    expect(formatLicenseNumber("  ph-123-456  ")).toBe("PH123456");
  });
});
