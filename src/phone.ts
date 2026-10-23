const TWO_DIGIT_AREAS = new Set(["33", "55", "56", "81"]);

/**
 * Turns any way people write a Mexican phone number into E.164, like "+527731521627". Handles
 * +52, 0052, the old +521 for mobiles, and the old 01, 044 and 045 prefixes. Returns null if it
 * isn't a valid 10-digit number.
 */
export function normalizePhone(value: string) {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length === 13 && /^04[45]/.test(digits)) digits = digits.slice(3);
  else if (digits.length === 13 && digits.startsWith("521")) digits = digits.slice(3);
  else if (digits.length === 12 && digits.startsWith("01")) digits = digits.slice(2);
  else if (digits.length === 12 && digits.startsWith("52")) digits = digits.slice(2);
  return /^[1-9]\d{9}$/.test(digits) ? `+52${digits}` : null;
}

export function isValidPhone(value: string) {
  return normalizePhone(value) !== null;
}

/**
 * Formats a phone number the way it's written in Mexico: "55 1234 5678" for Mexico City,
 * Guadalajara and Monterrey, "773 152 1627" for everywhere else. Pass `international` to get
 * "+52 773 152 1627".
 */
export function formatPhone(value: string, options: { international?: boolean } = {}) {
  const normalized = normalizePhone(value);
  if (!normalized) return null;
  const digits = normalized.slice(3);
  const local = TWO_DIGIT_AREAS.has(digits.slice(0, 2))
    ? `${digits.slice(0, 2)} ${digits.slice(2, 6)} ${digits.slice(6)}`
    : `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  return options.international ? `+52 ${local}` : local;
}
