/**
 * Ghana-specific address and phone helpers.
 *
 * SafeMeds serves students in Ghana — KNUST Kumasi campus drop points, licences
 * issued by the Pharmacy Council of Ghana — but the signup form was built
 * against US conventions: "New York", "NY", "10001", and a phone rule that
 * rejected the way Ghanaians actually write their own numbers.
 */

/** The sixteen administrative regions, as of the 2018 reorganisation. */
export const GHANA_REGIONS = [
  "Ahafo",
  "Ashanti",
  "Bono",
  "Bono East",
  "Central",
  "Eastern",
  "Greater Accra",
  "North East",
  "Northern",
  "Oti",
  "Savannah",
  "Upper East",
  "Upper West",
  "Volta",
  "Western",
  "Western North",
] as const;

/**
 * Suggestions only, offered through a datalist rather than a hard select.
 * Ghana has far more towns than any list should pretend to enumerate, and a
 * closed dropdown would simply lock out anyone living somewhere not on it.
 */
export const GHANA_CITY_SUGGESTIONS = [
  "Accra", "Kumasi", "Tamale", "Takoradi", "Cape Coast", "Sunyani", "Koforidua",
  "Ho", "Bolgatanga", "Wa", "Techiman", "Obuasi", "Tema", "Madina", "Ejisu",
  "Konongo", "Nkawkaw", "Winneba", "Berekum", "Aflao",
] as const;

/**
 * Accepts the formats Ghanaians actually type and returns E.164, or null.
 *
 *   0546132427       local, the common form          -> +233546132427
 *   +233546132427    international                   -> +233546132427
 *   233546132427     international without the plus  -> +233546132427
 *   054 613 2427     spaces and dashes               -> +233546132427
 *
 * The rule this replaces was `/^[\+]?[1-9][\d]{0,15}$/`, which required the
 * first digit to be 1-9. Every Ghanaian local number begins with 0, so the
 * form rejected them all and silently demanded +233 — the exact complaint.
 */
export function normalizeGhanaPhone(input: string): string | null {
  const digits = input.replace(/[\s\-().]/g, "");
  const national = /^0(\d{9})$/.exec(digits);
  if (national) return `+233${national[1]}`;
  const intl = /^(?:\+?233)(\d{9})$/.exec(digits);
  if (intl) return `+233${intl[1]}`;
  return null;
}

export function isValidGhanaPhone(input: string): boolean {
  return normalizeGhanaPhone(input) !== null;
}
