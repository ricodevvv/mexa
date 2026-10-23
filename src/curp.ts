import { compact, isoDate, isRealDate, plain, type Result } from "./shared.js";
import { findState, STATES, type State } from "./states.js";

export type Sex = "male" | "female" | "nonbinary";
export type CurpError = "format" | "date" | "state" | "check-digit";

export interface CurpInfo {
  curp: string;
  /** Birth date as YYYY-MM-DD. */
  birthDate: string;
  sex: Sex;
  /** Birth state, or null for people born abroad. */
  state: State | null;
  bornAbroad: boolean;
}

export interface CurpInput {
  /** Given names, like "María Fernanda". */
  name: string;
  firstLastName: string;
  secondLastName?: string;
  /** YYYY-MM-DD, or a Date (its local date is used). */
  birthDate: string | Date;
  sex: Sex | "H" | "M" | "X";
  /** Birth state by name or code, or "NE" for people born abroad. */
  state: string;
}

const CURP = /^([A-Z][AEIOUX][A-Z]{2})(\d{2})(\d{2})(\d{2})([HMX])([A-Z]{2})([B-DF-HJ-NP-TV-Z]{3})([0-9A-Z])(\d)$/;
const DICTIONARY = "0123456789ABCDEFGHIJKLMNÑOPQRSTUVWXYZ";
const SEXES: Record<string, Sex> = { H: "male", M: "female", X: "nonbinary" };
const PARTICLES = new Set(["DA", "DAS", "DE", "DEL", "DER", "DI", "DIE", "DD", "EL", "LA", "LOS", "LAS", "LE", "LES", "MAC", "MC", "VAN", "VON", "Y"]);
const COMMON_FIRST_NAMES = new Set(["MARIA", "MA", "M", "JOSE", "J"]);
const BAD_WORDS = new Set(
  (
    "BACA BAKA BUEI BUEY CACA CACO CAGA CAGO CAKA CAKO COGE COGI COJA COJE COJI COJO COLA CULO FALO FETO GETA GUEI GUEY JETA JOTO " +
    "KACA KACO KAGA KAGO KAKA KAKO KOGE KOGI KOJA KOJE KOJI KOJO KOLA KULO LILO LOCA LOCO LOKA LOKO MAME MAMO MEAR MEAS MEON MIAR " +
    "MION MOCO MOKO MULA MULO NACA NACO PEDA PEDO PENE PIPI PITO POPO PUTA PUTO QULO RATA ROBA ROBE ROBO RUIN SENO TETA VACA VAGA " +
    "VAGO VAKA VUEI VUEY WUEI WUEY"
  ).split(" "),
);

/**
 * Computes the last digit of a CURP from its first 17 characters.
 */
export function curpCheckDigit(first17: string) {
  let sum = 0;
  for (let i = 0; i < 17; i++) sum += DICTIONARY.indexOf(first17[i]) * (18 - i);
  return String((10 - (sum % 10)) % 10);
}

/**
 * Validates a CURP and pulls out the birth date, sex and birth state. Checks the format, that
 * the date exists, the state code and the check digit.
 */
export function checkCurp(value: string): Result<CurpInfo, CurpError> {
  const curp = compact(value);
  const match = CURP.exec(curp);
  if (!match) return { ok: false, error: "format" };
  const [, , yy, mm, dd, sex, stateCode, , differentiator] = match;
  const year = (/\d/.test(differentiator) ? 1900 : 2000) + Number(yy);
  if (!isRealDate(year, Number(mm), Number(dd))) return { ok: false, error: "date" };
  const bornAbroad = stateCode === "NE";
  const state = STATES.find((s) => s.curp === stateCode) ?? null;
  if (!state && !bornAbroad) return { ok: false, error: "state" };
  if (curpCheckDigit(curp) !== curp[17]) return { ok: false, error: "check-digit" };
  return { ok: true, value: { curp, birthDate: isoDate(year, Number(mm), Number(dd)), sex: SEXES[sex], state, bornAbroad } };
}

export function isValidCurp(value: string) {
  return checkCurp(value).ok;
}

export function parseCurp(value: string) {
  const result = checkCurp(value);
  return result.ok ? result.value : null;
}

function words(value: string | undefined, dropParticles = true) {
  const all = plain((value ?? "").toUpperCase().replace(/Ñ/g, "X"))
    .replace(/['´`]/g, "")
    .replace(/[^A-Z]+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);
  const kept = dropParticles ? all.filter((word) => !PARTICLES.has(word)) : all;
  return kept.length ? kept : all;
}

function internal(word: string | undefined, test: (letter: string) => boolean) {
  for (const letter of (word ?? "").slice(1)) if (test(letter)) return letter;
  return "X";
}

const isVowel = (letter: string) => "AEIOU".includes(letter);
const isConsonant = (letter: string) => !isVowel(letter);

/**
 * Builds a CURP from someone's details, following RENAPO's rules: particles like "de la" are
 * skipped, "María" and "José" give way to the second name, Ñ becomes X and rude words get an X.
 *
 * The 17th character is set by RENAPO to tell apart people who'd get the same CURP. This uses
 * "0" for people born before 2000 and "A" after, which is what nearly everyone gets.
 */
export function generateCurp(input: CurpInput) {
  const first = words(input.firstLastName);
  const second = words(input.secondLastName);
  let given = words(input.name, false);
  if (given.length > 1 && COMMON_FIRST_NAMES.has(given[0])) given = given.slice(1);
  given = given.filter((word) => !PARTICLES.has(word)).length ? given.filter((word) => !PARTICLES.has(word)) : given;
  if (!first.length || !given.length) throw new Error("A CURP needs at least a name and a first last name");

  const [paternal] = first;
  const [maternal] = second;
  const [name] = given;
  let initials = paternal[0] + internal(paternal, isVowel) + (maternal ? maternal[0] : "X") + name[0];
  if (BAD_WORDS.has(initials)) initials = initials[0] + "X" + initials.slice(2);

  let year: number, month: number, day: number;
  if (input.birthDate instanceof Date) {
    [year, month, day] = [input.birthDate.getFullYear(), input.birthDate.getMonth() + 1, input.birthDate.getDate()];
  } else {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input.birthDate);
    if (!match) throw new Error("birthDate has to be a Date or YYYY-MM-DD");
    [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  }
  if (!isRealDate(year, month, day)) throw new Error(`${input.birthDate} isn't a real date`);

  const sexLetter = input.sex.length === 1 ? input.sex.toUpperCase() : { male: "H", female: "M", nonbinary: "X" }[input.sex as Sex];
  if (!sexLetter || !SEXES[sexLetter]) throw new Error(`Unknown sex "${input.sex}", use male, female, nonbinary, H, M or X`);

  const abroad = /^(NE|EXTRANJERO|NACIDO EN EL EXTRANJERO|ABROAD|FOREIGN)$/i.test(plain(input.state).trim());
  const state = abroad ? "NE" : findState(input.state)?.curp;
  if (!state) throw new Error(`Unknown state "${input.state}"`);

  const first17 =
    initials +
    String(year % 100).padStart(2, "0") +
    String(month).padStart(2, "0") +
    String(day).padStart(2, "0") +
    sexLetter +
    state +
    internal(paternal, isConsonant) +
    (maternal ? internal(maternal, isConsonant) : "X") +
    internal(name, isConsonant) +
    (year < 2000 ? "0" : "A");
  return first17 + curpCheckDigit(first17);
}
