const UNITS = [
  "", "UNO", "DOS", "TRES", "CUATRO", "CINCO", "SEIS", "SIETE", "OCHO", "NUEVE",
  "DIEZ", "ONCE", "DOCE", "TRECE", "CATORCE", "QUINCE", "DIECISÉIS", "DIECISIETE", "DIECIOCHO", "DIECINUEVE",
  "VEINTE", "VEINTIUNO", "VEINTIDÓS", "VEINTITRÉS", "VEINTICUATRO", "VEINTICINCO", "VEINTISÉIS", "VEINTISIETE", "VEINTIOCHO", "VEINTINUEVE",
];
const TENS = ["", "", "", "TREINTA", "CUARENTA", "CINCUENTA", "SESENTA", "SETENTA", "OCHENTA", "NOVENTA"];
const HUNDREDS = [
  "", "CIENTO", "DOSCIENTOS", "TRESCIENTOS", "CUATROCIENTOS", "QUINIENTOS", "SEISCIENTOS", "SETECIENTOS", "OCHOCIENTOS", "NOVECIENTOS",
];
const CURRENCIES = {
  MXN: { one: "PESO", many: "PESOS", suffix: "M.N." },
  USD: { one: "DÓLAR", many: "DÓLARES", suffix: "USD" },
  EUR: { one: "EURO", many: "EUROS", suffix: "EUR" },
};

export type Currency = keyof typeof CURRENCIES;

export interface WordsOptions {
  /** Defaults to MXN. */
  currency?: Currency;
  /** Defaults to "upper", which is how invoices and checks write it. */
  case?: "upper" | "lower";
}

function shorten(words: string) {
  return words.replace(/VEINTIUNO$/, "VEINTIÚN").replace(/UNO$/, "UN");
}

function belowThousand(n: number, short: boolean) {
  if (n === 100) return "CIEN";
  const rest = n % 100;
  const tens = rest < 30 ? UNITS[rest] : TENS[Math.floor(rest / 10)] + (rest % 10 ? ` Y ${UNITS[rest % 10]}` : "");
  const words = [HUNDREDS[Math.floor(n / 100)], tens].filter(Boolean).join(" ");
  return short ? shorten(words) : words;
}

function integerWords(n: number, short: boolean): string {
  if (n === 0) return "CERO";
  const millions = Math.floor(n / 1_000_000);
  const thousands = Math.floor(n / 1000) % 1000;
  const rest = n % 1000;
  const parts: string[] = [];
  if (millions) parts.push(millions === 1 ? "UN MILLÓN" : `${integerWords(millions, true)} MILLONES`);
  if (thousands) parts.push(thousands === 1 ? "MIL" : `${belowThousand(thousands, true)} MIL`);
  if (rest) parts.push(belowThousand(rest, short));
  return parts.join(" ");
}

function applyCase(text: string, mode: WordsOptions["case"]) {
  return mode === "lower" ? text.toLowerCase().replace(/m\.n\.$/, "M.N.").replace(/ (usd|eur)$/, (s) => s.toUpperCase()) : text;
}

function check(n: number) {
  if (!Number.isFinite(n) || n < 0) throw new RangeError("Only positive numbers can be written out");
  if (n >= 1e12) throw new RangeError("Numbers up to 999,999,999,999 only");
}

/**
 * Writes a whole number out in Spanish: 2026 becomes "DOS MIL VEINTISÉIS".
 */
export function numberToWords(value: number, options: Pick<WordsOptions, "case"> = {}) {
  check(value);
  if (!Number.isInteger(value)) throw new RangeError("numberToWords takes whole numbers, use amountToWords for money");
  return applyCase(integerWords(value, false), options.case);
}

/**
 * Writes an amount the way Mexican invoices and checks do ("cantidad con letra"):
 * 1234.5 becomes "MIL DOSCIENTOS TREINTA Y CUATRO PESOS 50/100 M.N.".
 */
export function amountToWords(value: number | string, options: WordsOptions = {}) {
  const amount = typeof value === "string" ? Number(value.replace(/[$,\s]/g, "")) : value;
  check(amount);
  const cents = Math.round(amount * 100);
  const whole = Math.floor(cents / 100);
  const currency = CURRENCIES[options.currency ?? "MXN"];
  if (!currency) throw new Error(`Unknown currency ${options.currency}`);
  const exactMillions = whole >= 1_000_000 && whole % 1_000_000 === 0;
  const text = [
    integerWords(whole, true),
    exactMillions ? "DE" : "",
    whole === 1 ? currency.one : currency.many,
    `${String(cents % 100).padStart(2, "0")}/100`,
    currency.suffix,
  ]
    .filter(Boolean)
    .join(" ");
  return applyCase(text, options.case);
}
