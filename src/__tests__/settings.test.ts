import { describe, it, expect } from "vitest";
import { SettingsService } from "@/services/settingsService";

describe("SettingsService.validateSettings", () => {
  it("should accept valid settings", () => {
    const result = SettingsService.validateSettings({
      theme: "dark",
      language: "en",
      timezone: "UTC",
      dateFormat: "MM/DD/YYYY",
    });

    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should reject invalid theme", () => {
    const result = SettingsService.validateSettings({
      theme: "neon",
    });

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Theme must be either 'light' or 'dark'");
  });

  it("should reject invalid language", () => {
    const result = SettingsService.validateSettings({
      language: "jp",
    });

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Language must be one of: en, es, fr, de");
  });

  it("should reject invalid timezone", () => {
    const result = SettingsService.validateSettings({
      timezone: "GMT",
    });

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Timezone must be one of: UTC, EST, PST, CET");
  });

  it("should reject invalid date format", () => {
    const result = SettingsService.validateSettings({
      dateFormat: "DD-MM-YYYY",
    });

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(
      "Date format must be one of: MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD"
    );
  });

  it("should reject data retention period out of range", () => {
    const result = SettingsService.validateSettings({
      privacy: { dataRetentionPeriod: "0" },
    });

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(
      "Data retention period must be between 1 and 365 days"
    );
  });

  it("should reject delivery radius out of range", () => {
    const result = SettingsService.validateSettings({
      delivery: { deliveryRadius: "100" },
    });

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(
      "Delivery radius must be between 0.1 and 50 miles"
    );
  });

  it("should reject session timeout out of range", () => {
    const result = SettingsService.validateSettings({
      security: { sessionTimeout: "0" },
    });

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(
      "Session timeout must be between 5 and 1440 minutes"
    );
  });

  it("should collect multiple validation errors", () => {
    const result = SettingsService.validateSettings({
      theme: "neon",
      timezone: "GMT",
      dateFormat: "invalid",
    });

    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(3);
  });
});
