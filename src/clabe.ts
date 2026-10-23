import { BANKS } from "./banks.js";
import type { Result } from "./shared.js";

export type ClabeError = "format" | "check-digit";

export interface ClabeInfo {
  clabe: string;
  /** The bank, or null when the code isn't in the list (a new participant, most likely). */
  bank: { code: string; name: string } | null;
  /** Three-digit city code (plaza). */
  plaza: string;
  /** The 11-digit account number. */
  account: string;
}

const WEIGHTS = [3, 7, 1];

/**
 * Computes the last digit of a CLABE from its first 17 digits.
 */
export function clabeCheckDigit(first17: string) {
  let sum = 0;
  for (let i = 0; i < 17; i++) sum += (Number(first17[i]) * WEIGHTS[i % 3]) % 10;
  return String((10 - (sum % 10)) % 10);
}

/**
 * Validates an 18-digit CLABE and tells you the bank, plaza and account it points to.
 */
export function checkClabe(value: string): Result<ClabeInfo, ClabeError> {
  const clabe = value.replace(/[\s-]/g, "");
  if (!/^\d{18}$/.test(clabe)) return { ok: false, error: "format" };
  if (clabeCheckDigit(clabe) !== clabe[17]) return { ok: false, error: "check-digit" };
  const code = clabe.slice(0, 3);
  return {
    ok: true,
    value: {
      clabe,
      bank: BANKS[code] ? { code, name: BANKS[code] } : null,
      plaza: clabe.slice(3, 6),
      account: clabe.slice(6, 17),
    },
  };
}

export function isValidClabe(value: string) {
  return checkClabe(value).ok;
}

export function parseClabe(value: string) {
  const result = checkClabe(value);
  return result.ok ? result.value : null;
}

/**
 * Builds a CLABE from a bank code, plaza and account number, adding the check digit.
 */
export function generateClabe(bank: string, plaza: string, account: string) {
  const first17 = bank.padStart(3, "0") + plaza.padStart(3, "0") + account.padStart(11, "0");
  if (!/^\d{17}$/.test(first17)) throw new Error("Bank and plaza take 3 digits and the account 11, numbers only");
  return first17 + clabeCheckDigit(first17);
}
