import axios from "axios";

export interface LicenseVerificationResult {
  isValid: boolean;
  message?: string;
  details?: {
    name?: string;
    state?: string;
    expirationDate?: string;
    status?: string;
  };
  error?: string;
}

export interface LicenseCheckResult {
  isValid: boolean;
  available: boolean;
  error?: string;
}

/**
 * Verify a pharmacist license number
 * @param licenseNumber - The license number to verify
 * @param email - Optional email for checking if license is already registered
 * @param state - Optional state for verification
 * @param isSignIn - Whether this is for sign-in verification (allows new licenses)
 * @returns Promise<LicenseVerificationResult>
 */
export const verifyLicense = async (
  licenseNumber: string,
  email?: string,
  state?: string,
  isSignIn: boolean = false
): Promise<LicenseVerificationResult> => {
  try {
    const response = await axios.post("/api/auth/verify-license", {
      licenseNumber,
      email,
      state,
      isSignIn,
    });

    return response.data;
  } catch (error: unknown) {
    console.error("License verification error:", error);

    const err = error as { response?: { data?: { error?: string } } };
    if (err.response?.data) {
      return {
        isValid: false,
        error: err.response.data.error || "License verification failed",
      };
    }

    return {
      isValid: false,
      error: "Unable to verify license. Please try again later.",
    };
  }
};

/**
 * Check if a license number is available (real-time validation)
 * @param licenseNumber - The license number to check
 * @param email - Optional email to exclude from check
 * @returns Promise<LicenseCheckResult>
 */
export const checkLicenseAvailability = async (
  licenseNumber: string,
  email?: string
): Promise<LicenseCheckResult> => {
  try {
    const params = new URLSearchParams({ licenseNumber });
    if (email) {
      params.append("email", email);
    }

    const response = await axios.get(`/api/auth/verify-license?${params}`);
    return response.data;
  } catch (error: unknown) {
    console.error("License availability check error:", error);

    const err = error as { response?: { data?: { error?: string } } };
    if (err.response?.data) {
      return {
        isValid: false,
        available: false,
        error: err.response.data.error || "License check failed",
      };
    }

    return {
      isValid: false,
      available: false,
      error: "Unable to check license availability. Please try again later.",
    };
  }
};

/**
 * Verify license for sign-in (allows new licenses)
 * @param licenseNumber - The license number to verify
 * @param email - Email of the user signing in
 * @param state - Optional state for verification
 * @returns Promise<LicenseVerificationResult>
 */
export const verifyLicenseForSignIn = async (
  licenseNumber: string,
  email: string,
  state?: string
): Promise<LicenseVerificationResult> => {
  return verifyLicense(licenseNumber, email, state, true);
};

/**
 * The one licence-number shape for the whole app.
 *
 * There were previously two regexes that disagreed: `/^[A-Z]{2}\d{6}$/` here
 * and `/^[A-Za-z]{1,2}\d{6,7}$/` in the verify-license route. The same number
 * could validate in one place and be rejected in the other.
 *
 * 1–3 letters followed by 4–8 digits. Three letters matters: the sign-in form
 * has always advertised `RPh-123456` as its example while every rule above
 * capped prefixes at two letters, so the format the UI asked for could never
 * pass. Board prefixes (PH, RPh, NY…) and digit lengths vary by jurisdiction,
 * so the shape is intentionally broad.
 *
 * This is a *format* check, not proof of a licence. Authorisation comes from
 * the number matching the account's own stored record, plus admin review via
 * the LicenseVerification flow. Widening the shape does not widen access.
 */
export const LICENSE_PATTERN = /^[A-Z]{1,3}\d{4,8}$/;

/**
 * Validate license number format
 * @param licenseNumber - The license number to validate
 * @returns boolean
 */
export const validateLicenseFormat = (licenseNumber: string): boolean => {
  // Checks the normalised form. Callers run input through formatLicenseNumber
  // first, so "rph-123456" is accepted as RPH123456 while a raw mixed-case
  // string is not silently treated as already valid.
  return LICENSE_PATTERN.test(licenseNumber);
};

/**
 * Format license number for display
 * @param licenseNumber - The license number to format
 * @returns string
 */
export const formatLicenseNumber = (licenseNumber: string): string => {
  // Strip separators people type ("RPh-123-456") and normalise case.
  //
  // This no longer truncates. The previous version sliced anything 8+ chars to
  // two letters and six digits, which silently rewrote a valid RPH12345678
  // into RPH12345 — a different licence number. Mangling an identifier is
  // worse than rejecting it: validateLicenseFormat can reject a bad shape,
  // but nothing can recover digits that were thrown away.
  return licenseNumber.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
};
