import { describe, expect, it } from "vitest";
import {
  amountToWords,
  checkClabe,
  checkCurp,
  checkNss,
  checkRfc,
  findState,
  formatPhone,
  generateClabe,
  generateCurp,
  isValidCurp,
  isValidRfc,
  normalizePhone,
  numberToWords,
  parseCurp,
  stateFromPostalCode,
} from "../src/index.js";

describe("curp", () => {
  it("validates and parses real CURPs", () => {
    expect(parseCurp("LOOA531113HTCPBN07")).toMatchObject({ birthDate: "1953-11-13", sex: "male", state: { name: "Tabasco" }, bornAbroad: false });
    expect(parseCurp(" pxne660720hmcxtn06 ")?.state?.iso).toBe("MX-MEX");
  });

  it("explains what's wrong", () => {
    expect(checkCurp("LOOA531113HTCPBN0")).toEqual({ ok: false, error: "format" });
    expect(checkCurp("LOOA530230HTCPBN07")).toEqual({ ok: false, error: "date" });
    expect(checkCurp("LOOA531113HZZPBN07")).toEqual({ ok: false, error: "state" });
    expect(checkCurp("LOOA531113HTCPBN08")).toEqual({ ok: false, error: "check-digit" });
  });

  it("reads 2000s birth dates and people born abroad", () => {
    const curp = generateCurp({ name: "Sofía", firstLastName: "Ruiz", birthDate: "2004-02-29", sex: "female", state: "extranjero" });
    expect(curp).toMatch(/^RUXS040229MNE/);
    expect(parseCurp(curp)).toMatchObject({ birthDate: "2004-02-29", sex: "female", state: null, bornAbroad: true });
  });

  it("generates CURPs following RENAPO's rules", () => {
    expect(generateCurp({ name: "Andrés Manuel", firstLastName: "López", secondLastName: "Obrador", birthDate: "1953-11-13", sex: "male", state: "Tabasco" })).toBe("LOOA531113HTCPBN07");
    expect(generateCurp({ name: "Enrique", firstLastName: "Peña", secondLastName: "Nieto", birthDate: "1966-07-20", sex: "H", state: "Edomex" })).toBe("PXNE660720HMCXTN06");
    const maria = generateCurp({ name: "María de los Ángeles", firstLastName: "de la Cruz", secondLastName: "Gómez", birthDate: new Date(1990, 4, 5), sex: "female", state: "CDMX" });
    expect(maria.slice(0, 13)).toBe("CUGA900505MDF");
    expect(isValidCurp(maria)).toBe(true);
  });

  it("refuses bad input", () => {
    expect(() => generateCurp({ name: "Ana", firstLastName: "Paz", birthDate: "2001-02-30", sex: "female", state: "Puebla" })).toThrow("real date");
    expect(() => generateCurp({ name: "Ana", firstLastName: "Paz", birthDate: "2001-02-03", sex: "female", state: "Narnia" })).toThrow("Unknown state");
  });
});

describe("rfc", () => {
  it("matches SAT's check digit on real RFCs", () => {
    for (const rfc of ["EKU9003173C9", "XIA190128J61", "SAT970701NN3", "CACX7605101P8", "FUNK671228PH6", "IAÑL750210963"]) {
      expect(checkRfc(rfc)).toMatchObject({ ok: true, value: { checkDigitMatches: true } });
      expect(isValidRfc(rfc, { checkDigit: true })).toBe(true);
    }
  });

  it("tells people, companies and generic RFCs apart", () => {
    expect(checkRfc("CACX7605101P8")).toMatchObject({ value: { type: "person", date: "1976-05-10", homoclave: "1P" } });
    expect(checkRfc("eku9003173c9")).toMatchObject({ value: { type: "company", date: "1990-03-17" } });
    expect(checkRfc("XAXX010101000")).toMatchObject({ value: { type: "generic" } });
  });

  it("only rejects a wrong check digit when asked", () => {
    expect(checkRfc("CACX7605101P9")).toMatchObject({ ok: true, value: { checkDigitMatches: false } });
    expect(checkRfc("CACX7605101P9", { checkDigit: true })).toEqual({ ok: false, error: "check-digit" });
    expect(checkRfc("CACX7613101P8")).toEqual({ ok: false, error: "date" });
    expect(checkRfc("CAC1")).toEqual({ ok: false, error: "format" });
  });
});

describe("clabe", () => {
  it("validates and finds the bank", () => {
    expect(checkClabe("002 010 07777777777 1")).toEqual({
      ok: true,
      value: { clabe: "002010077777777771", bank: { code: "002", name: "Banamex" }, plaza: "010", account: "07777777777" },
    });
    expect(checkClabe("002010077777777772")).toEqual({ ok: false, error: "check-digit" });
    expect(checkClabe("12345")).toEqual({ ok: false, error: "format" });
  });

  it("generates CLABEs and keeps unknown banks valid", () => {
    expect(generateClabe("2", "10", "7777777777")).toBe("002010077777777771");
    const unknown = generateClabe("999", "180", "123");
    expect(checkClabe(unknown)).toMatchObject({ ok: true, value: { bank: null } });
  });
});

describe("nss", () => {
  it("validates and reads the years", () => {
    expect(checkNss("72795608040")).toEqual({ ok: true, value: { nss: "72795608040", subdelegation: "72", registrationYear: 1979, birthYear: 1956 } });
    expect(checkNss("72795608041")).toEqual({ ok: false, error: "check-digit" });
    expect(checkNss("7279")).toEqual({ ok: false, error: "format" });
  });
});

describe("states and postal codes", () => {
  it("finds states by name, alias or code", () => {
    expect(findState("hidalgo")?.curp).toBe("HG");
    expect(findState("Nuevo Leon")?.iso).toBe("MX-NLE");
    expect(findState("CDMX")?.name).toBe("Ciudad de México");
    expect(findState("MX-YUC")?.name).toBe("Yucatán");
    expect(findState(15)?.name).toBe("Estado de México");
    expect(findState("Atlantis")).toBeUndefined();
  });

  it("maps postal codes to states", () => {
    expect(stateFromPostalCode("42800")?.name).toBe("Hidalgo");
    expect(stateFromPostalCode(1000)?.name).toBe("Ciudad de México");
    expect(stateFromPostalCode("64000")?.name).toBe("Nuevo León");
    expect(stateFromPostalCode("17000")).toBeNull();
    expect(stateFromPostalCode("4280")).toBeNull();
  });
});

describe("phone", () => {
  it("normalizes every common way of writing a number", () => {
    for (const input of ["773 152 1627", "(773) 152-1627", "+52 773 152 1627", "+52 1 773 152 1627", "0052 7731521627", "01 773 152 1627", "045 773 152 1627"]) {
      expect(normalizePhone(input)).toBe("+527731521627");
    }
    expect(normalizePhone("152 1627")).toBeNull();
  });

  it("formats with two- and three-digit area codes", () => {
    expect(formatPhone("5512345678")).toBe("55 1234 5678");
    expect(formatPhone("+52 773 152 1627")).toBe("773 152 1627");
    expect(formatPhone("3312345678", { international: true })).toBe("+52 33 1234 5678");
  });
});

describe("words", () => {
  it("writes amounts like Mexican invoices do", () => {
    expect(amountToWords(1234.5)).toBe("MIL DOSCIENTOS TREINTA Y CUATRO PESOS 50/100 M.N.");
    expect(amountToWords(1)).toBe("UN PESO 00/100 M.N.");
    expect(amountToWords("$21,000.99")).toBe("VEINTIÚN MIL PESOS 99/100 M.N.");
    expect(amountToWords(1_000_000)).toBe("UN MILLÓN DE PESOS 00/100 M.N.");
    expect(amountToWords(2_500_000)).toBe("DOS MILLONES QUINIENTOS MIL PESOS 00/100 M.N.");
    expect(amountToWords(100.1, { currency: "USD", case: "lower" })).toBe("cien dólares 10/100 USD");
    expect(amountToWords(0.29)).toBe("CERO PESOS 29/100 M.N.");
  });

  it("writes whole numbers", () => {
    expect(numberToWords(2026)).toBe("DOS MIL VEINTISÉIS");
    expect(numberToWords(101)).toBe("CIENTO UNO");
    expect(numberToWords(31, { case: "lower" })).toBe("treinta y uno");
    expect(() => numberToWords(1.5)).toThrow();
    expect(() => amountToWords(-1)).toThrow();
  });
});
