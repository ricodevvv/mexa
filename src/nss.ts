import { fullYear, type Result } from "./shared.js";

export type NssError = "format" | "check-digit";

export interface NssInfo {
  nss: string;
  /** IMSS subdelegation that issued it. */
  subdelegation: string;
  /** Year the person was signed up with IMSS. */
  registrationYear: number;
  birthYear: number;
}

/**
 * Computes the last digit of an IMSS social security number (NSS) from its first 10 digits.
 */
export function nssCheckDigit(first10: string) {
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    const product = Number(first10[i]) * (i % 2 ? 2 : 1);
    sum += product > 9 ? product - 9 : product;
  }
  return String((10 - (sum % 10)) % 10);
}

/**
 * Validates an 11-digit NSS and reads the subdelegation, registration year and birth year out of it.
 */
export function checkNss(value: string): Result<NssInfo, NssError> {
  const nss = value.replace(/[\s-]/g, "");
  if (!/^\d{11}$/.test(nss)) return { ok: false, error: "format" };
  if (nssCheckDigit(nss) !== nss[10]) return { ok: false, error: "check-digit" };
  const registrationYear = fullYear(Number(nss.slice(2, 4)));
  let birthYear = 2000 + Number(nss.slice(4, 6));
  if (birthYear > registrationYear) birthYear -= 100;
  return { ok: true, value: { nss, subdelegation: nss.slice(0, 2), registrationYear, birthYear } };
}

export function isValidNss(value: string) {
  return checkNss(value).ok;
}

export function parseNss(value: string) {
  const result = checkNss(value);
  return result.ok ? result.value : null;
}
