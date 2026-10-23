import { plain } from "./shared.js";

export interface State {
  /** Common name, like "Hidalgo" or "Ciudad de México". */
  name: string;
  /** Two-letter code used in the CURP, like "HG". */
  curp: string;
  /** INEGI code, "01" to "32". */
  inegi: string;
  /** ISO 3166-2 code, like "MX-HID". */
  iso: string;
  /** First two digits of the postal codes that belong to it. */
  postalPrefixes: [number, number];
}

const state = (name: string, curp: string, inegi: string, iso: string, from: number, to = from): State => ({
  name,
  curp,
  inegi,
  iso,
  postalPrefixes: [from, to],
});

/** The 32 federal entities, in INEGI order. */
export const STATES: readonly State[] = [
  state("Aguascalientes", "AS", "01", "MX-AGU", 20),
  state("Baja California", "BC", "02", "MX-BCN", 21, 22),
  state("Baja California Sur", "BS", "03", "MX-BCS", 23),
  state("Campeche", "CC", "04", "MX-CAM", 24),
  state("Coahuila", "CL", "05", "MX-COA", 25, 27),
  state("Colima", "CM", "06", "MX-COL", 28),
  state("Chiapas", "CS", "07", "MX-CHP", 29, 30),
  state("Chihuahua", "CH", "08", "MX-CHH", 31, 33),
  state("Ciudad de México", "DF", "09", "MX-CMX", 1, 16),
  state("Durango", "DG", "10", "MX-DUR", 34, 35),
  state("Guanajuato", "GT", "11", "MX-GUA", 36, 38),
  state("Guerrero", "GR", "12", "MX-GRO", 39, 41),
  state("Hidalgo", "HG", "13", "MX-HID", 42, 43),
  state("Jalisco", "JC", "14", "MX-JAL", 44, 49),
  state("Estado de México", "MC", "15", "MX-MEX", 50, 57),
  state("Michoacán", "MN", "16", "MX-MIC", 58, 61),
  state("Morelos", "MS", "17", "MX-MOR", 62),
  state("Nayarit", "NT", "18", "MX-NAY", 63),
  state("Nuevo León", "NL", "19", "MX-NLE", 64, 67),
  state("Oaxaca", "OC", "20", "MX-OAX", 68, 71),
  state("Puebla", "PL", "21", "MX-PUE", 72, 75),
  state("Querétaro", "QT", "22", "MX-QUE", 76),
  state("Quintana Roo", "QR", "23", "MX-ROO", 77),
  state("San Luis Potosí", "SP", "24", "MX-SLP", 78, 79),
  state("Sinaloa", "SL", "25", "MX-SIN", 80, 82),
  state("Sonora", "SR", "26", "MX-SON", 83, 85),
  state("Tabasco", "TC", "27", "MX-TAB", 86),
  state("Tamaulipas", "TS", "28", "MX-TAM", 87, 89),
  state("Tlaxcala", "TL", "29", "MX-TLA", 90),
  state("Veracruz", "VZ", "30", "MX-VER", 91, 96),
  state("Yucatán", "YN", "31", "MX-YUC", 97),
  state("Zacatecas", "ZS", "32", "MX-ZAC", 98, 99),
];

const ALIASES: Record<string, string> = {
  CDMX: "09",
  DF: "09",
  "DISTRITO FEDERAL": "09",
  "MEXICO CITY": "09",
  EDOMEX: "15",
  MEXICO: "15",
  "ESTADO DE MEXICO": "15",
  "COAHUILA DE ZARAGOZA": "05",
  "MICHOACAN DE OCAMPO": "16",
  "VERACRUZ DE IGNACIO DE LA LLAVE": "30",
};

function key(value: string) {
  return plain(value).trim().toUpperCase().replace(/\s+/g, " ").replace(/\.$/, "");
}

/**
 * Finds a state by name (accents and case don't matter, "CDMX" and "Edomex" work), or by its
 * CURP, INEGI or ISO code.
 */
export function findState(query: string | number): State | undefined {
  const wanted = key(String(query));
  if (/^\d{1,2}$/.test(wanted)) return STATES.find((s) => s.inegi === wanted.padStart(2, "0"));
  const alias = ALIASES[wanted];
  if (alias) return STATES.find((s) => s.inegi === alias);
  return STATES.find((s) => key(s.name) === wanted || s.curp === wanted || s.iso === wanted || s.iso === `MX-${wanted}`);
}
