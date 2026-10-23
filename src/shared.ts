/** What every `check*` function returns: the parsed value, or an error code you can map to your own message. */
export type Result<T, E extends string> = { ok: true; value: T } | { ok: false; error: E };

export function compact(value: string) {
  return value.trim().toUpperCase().replace(/[\s-]/g, "");
}

export function isRealDate(year: number, month: number, day: number) {
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function isoDate(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function fullYear(twoDigits: number, today = new Date()) {
  const current = today.getFullYear() % 100;
  return twoDigits <= current ? 2000 + twoDigits : 1900 + twoDigits;
}

export function plain(value: string) {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "");
}
