import { describe, it, expect } from "vitest";
import {
  validateLicenseFormat,
  formatLicenseNumber,
} from "@/services/licenseService";

/**
 * The accepted shape is 1–3 letters followed by 4–8 digits, checked against the
 * normalised (uppercased, separator-stripped) form.
 *
 * This widened from `/^[A-Z]{2}\d{6}$/`. Three of the assertions below were
 * inverted as part of that change rather than deleted, so the new rule is
 * pinned as deliberately as the old one was:
 *
 *  - "ABC123456" and "RPh123456" were rejected for having three letters, which
 *    made the `RPh-123456` example printed on the sign-in form impossible to
 *    satisfy.
 *  - "PH12345" was rejected for having five digits; digit length varies by
 *    issuing board.
 *  - formatLicenseNumber("PH12345678") returned "PH123456" — it truncated a
 *    valid number into a different one.
 */

describe("License Service - validateLicenseFormat", () => {
  it("accepts two letters and six digits (PH123456)", () => {
    expect(validateLicenseFormat("PH123456")).toBe(true);
  });

  it("accepts a different state code (NY789012)", () => {
    expect(validateLicenseFormat("NY789012")).toBe(true);
  });

  // The three-letter RPh prefix the sign-in form advertises, at each of the
  // digit lengths in use.
  it.each(["RPH1234", "RPH123456", "RPH12345678"])(
    "accepts the RPh prefix: %s",
    (licence) => {
      expect(validateLicenseFormat(licence)).toBe(true);
    }
  );

  it("accepts three letters (ABC123456)", () => {
    expect(validateLicenseFormat("ABC123456")).toBe(true);
  });

  it("accepts a shorter digit run (PH12345)", () => {
    expect(validateLicenseFormat("PH12345")).toBe(true);
  });

  it("rejects four or more letters", () => {
    expect(validateLicenseFormat("ABCD123456")).toBe(false);
  });

  it("rejects fewer than four digits", () => {
    expect(validateLicenseFormat("PH123")).toBe(false);
  });

  it("rejects more than eight digits", () => {
    expect(validateLicenseFormat("PH123456789")).toBe(false);
  });

  it("rejects a licence with no digits", () => {
    expect(validateLicenseFormat("PH")).toBe(false);
  });

  it("rejects an empty string", () => {
    expect(validateLicenseFormat("")).toBe(false);
  });

  // Validation runs on the normalised form; callers pass input through
  // formatLicenseNumber first. A raw lowercase string is not itself valid.
  it("rejects an unnormalised lowercase string", () => {
    expect(validateLicenseFormat("ph123456")).toBe(false);
  });

  it("rejects digits interleaved with letters (P1H23456)", () => {
    expect(validateLicenseFormat("P1H23456")).toBe(false);
  });

  it("rejects separators that normalisation would have stripped", () => {
    expect(validateLicenseFormat("RPh-123-456")).toBe(false);
  });
});

describe("License Service - formatLicenseNumber", () => {
  it("leaves a clean licence number alone", () => {
    expect(formatLicenseNumber("PH123456")).toBe("PH123456");
  });

  it("strips non-alphanumeric characters", () => {
    expect(formatLicenseNumber("PH-123-456")).toBe("PH123456");
  });

  it("converts to uppercase", () => {
    expect(formatLicenseNumber("ph123456")).toBe("PH123456");
  });

  it("trims surrounding whitespace and separators together", () => {
    expect(formatLicenseNumber("  ph-123-456  ")).toBe("PH123456");
  });

  it("normalises the RPh prefix as typed on the sign-in form", () => {
    expect(formatLicenseNumber("RPh-123456")).toBe("RPH123456");
  });

  // Regression: truncating rewrote one licence number into another. Rejecting a
  // bad shape is recoverable; silently discarding digits is not.
  it("does not truncate long licence numbers", () => {
    expect(formatLicenseNumber("PH12345678")).toBe("PH12345678");
    expect(formatLicenseNumber("RPh12345678")).toBe("RPH12345678");
  });

  it("round-trips into a valid licence for every advertised RPh form", () => {
    for (const typed of ["RPh1234", "RPh-123456", "rph 12345678"]) {
      expect(validateLicenseFormat(formatLicenseNumber(typed))).toBe(true);
    }
  });
});
