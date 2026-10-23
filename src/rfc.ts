import { compact, fullYear, isoDate, isRealDate, type Result } from "./shared.js";

export type RfcType = "person" | "company" | "generic";
export type RfcError = "format" | "date" | "check-digit";

export interface RfcInfo {
  rfc: string;
  /** "person" for persona física, "company" for persona moral, "generic" for XAXX010101000 and XEXX010101000. */
  type: RfcType;
  /** Birth date for people, incorporation date for companies, as YYYY-MM-DD. */
  date: string;
  homoclave: string;
  /** Whether the last character matches SAT's algorithm. Some real, older RFCs don't. */
  checkDigitMatches: boolean;
}

export interface RfcOptions {
  /** Reject RFCs whose check digit doesn't match. Off by default because some real RFCs fail it. */
  checkDigit?: boolean;
}

const RFC = /^([A-ZÑ&]{3,4})(\d{2})(\d{2})(\d{2})([A-Z\d]{2})([A\d])$/;
const DICTIONARY = "0123456789ABCDEFGHIJKLMN&OPQRSTUVWXYZ Ñ";
const GENERIC = new Set(["XAXX010101000", "XEXX010101000"]);

/**
 * Computes the last character of an RFC from the ones before it (11 for companies, 12 for people).
 */
export function rfcCheckDigit(withoutCheckDigit: string) {
  const padded = withoutCheckDigit.padStart(12, " ");
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += DICTIONARY.indexOf(padded[i]) * (13 - i);
  return DICTIONARY[(11 - (sum % 11)) % 11];
}

/**
 * Validates an RFC, for people or companies, and tells you which one it is and its date.
 */
export function checkRfc(value: string, options: RfcOptions = {}): Result<RfcInfo, RfcError> {
  const rfc = compact(value);
  if (GENERIC.has(rfc)) {
    return { ok: true, value: { rfc, type: "generic", date: "2001-01-01", homoclave: "00", checkDigitMatches: true } };
  }
  const match = RFC.exec(rfc);
  if (!match) return { ok: false, error: "format" };
  const [, letters, yy, mm, dd, homoclave] = match;
  const year = fullYear(Number(yy));
  if (!isRealDate(year, Number(mm), Number(dd))) return { ok: false, error: "date" };
  const checkDigitMatches = rfcCheckDigit(rfc.slice(0, -1)) === rfc.at(-1);
  if (options.checkDigit && !checkDigitMatches) return { ok: false, error: "check-digit" };
  return {
    ok: true,
    value: {
      rfc,
      type: letters.length === 4 ? "person" : "company",
      date: isoDate(year, Number(mm), Number(dd)),
      homoclave,
      checkDigitMatches,
    },
  };
}

export function isValidRfc(value: string, options?: RfcOptions) {
  return checkRfc(value, options).ok;
}

export function parseRfc(value: string, options?: RfcOptions) {
  const result = checkRfc(value, options);
  return result.ok ? result.value : null;
}
