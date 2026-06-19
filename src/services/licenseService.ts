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
 * Validate license number format
 * @param licenseNumber - The license number to validate
 * @returns boolean
 */
export const validateLicenseFormat = (licenseNumber: string): boolean => {
  // Format: PH123456 (2 letters followed by 6 digits)
  const licenseRegex = /^[A-Z]{2}\d{6}$/;
  return licenseRegex.test(licenseNumber);
};

/**
 * Format license number for display
 * @param licenseNumber - The license number to format
 * @returns string
 */
export const formatLicenseNumber = (licenseNumber: string): string => {
  // Remove any non-alphanumeric characters and convert to uppercase
  const cleaned = licenseNumber.replace(/[^A-Za-z0-9]/g, "").toUpperCase();

  // Ensure it follows the format PH123456
  if (cleaned.length >= 8) {
    return `${cleaned.slice(0, 2)}${cleaned.slice(2, 8)}`;
  }

  return cleaned;
};
