import { STATES, type State } from "./states.js";

/**
 * Normalizes a postal code to its 5 digits, or null if it can't be one. Numbers get their
 * leading zero back, so 1000 becomes "01000".
 */
export function normalizePostalCode(value: string | number) {
  const code = typeof value === "number" ? String(Math.trunc(value)).padStart(5, "0") : value.trim();
  return /^\d{5}$/.test(code) ? code : null;
}

/**
 * Tells you which state a postal code belongs to, from its first two digits.
 */
export function stateFromPostalCode(value: string | number): State | null {
  const code = normalizePostalCode(value);
  if (!code) return null;
  const prefix = Number(code.slice(0, 2));
  return STATES.find(({ postalPrefixes: [from, to] }) => prefix >= from && prefix <= to) ?? null;
}

export function isValidPostalCode(value: string | number) {
  return stateFromPostalCode(value) !== null;
}
