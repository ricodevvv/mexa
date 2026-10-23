export type { Result } from "./shared.js";
export { STATES, findState, type State } from "./states.js";
export {
  checkCurp,
  isValidCurp,
  parseCurp,
  generateCurp,
  curpCheckDigit,
  type CurpInfo,
  type CurpInput,
  type CurpError,
  type Sex,
} from "./curp.js";
export { checkRfc, isValidRfc, parseRfc, rfcCheckDigit, type RfcInfo, type RfcOptions, type RfcError, type RfcType } from "./rfc.js";
export { checkClabe, isValidClabe, parseClabe, generateClabe, clabeCheckDigit, type ClabeInfo, type ClabeError } from "./clabe.js";
export { BANKS } from "./banks.js";
export { checkNss, isValidNss, parseNss, nssCheckDigit, type NssInfo, type NssError } from "./nss.js";
export { stateFromPostalCode, normalizePostalCode, isValidPostalCode } from "./postal.js";
export { normalizePhone, formatPhone, isValidPhone } from "./phone.js";
export { amountToWords, numberToWords, type WordsOptions, type Currency } from "./words.js";
