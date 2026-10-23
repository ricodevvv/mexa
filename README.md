# mexico-utils

Validate, parse and generate Mexican data in TypeScript: CURP, RFC, CLABE, NSS, postal codes, phone numbers and amounts in words ("cantidad con letra"). No dependencies, works in Node and the browser, under 7 KB gzipped.

```bash
npm install mexico-utils
```

```ts
import { parseCurp, checkRfc, parseClabe, amountToWords } from "mexico-utils";

parseCurp("LOOA531113HTCPBN07");
// { birthDate: "1953-11-13", sex: "male", state: { name: "Tabasco", ... }, bornAbroad: false }

checkRfc("EKU9003173C9");
// { ok: true, value: { type: "company", date: "1990-03-17", homoclave: "3C", checkDigitMatches: true } }

parseClabe("002010077777777771")?.bank;
// { code: "002", name: "Banamex" }

amountToWords(1234.5);
// "MIL DOSCIENTOS TREINTA Y CUATRO PESOS 50/100 M.N."
```

## How the API works

Every document type has the same four functions:

- `isValidX(value)` returns a boolean.
- `parseX(value)` returns the parsed data, or `null`.
- `checkX(value)` returns `{ ok: true, value }` or `{ ok: false, error }`. The error is a code like `"format"`, `"date"` or `"check-digit"`, so you can show your own message in whatever language your form uses.
- `xCheckDigit(...)` computes the check digit, in case you need it.

Input gets cleaned first: spaces, dashes and lowercase are fine.

```ts
const result = checkCurp(input);
if (!result.ok) {
  const messages = {
    format: "La CURP tiene 18 caracteres",
    date: "La fecha de nacimiento no existe",
    state: "El estado no es válido",
    "check-digit": "Revisa que la hayas copiado bien",
  };
  showError(messages[result.error]);
}
```

## CURP

`checkCurp` checks the format, that the birth date exists, the state code and the check digit, and gives you the birth date, sex (`male`, `female` or `nonbinary`), state and whether the person was born abroad.

`generateCurp` builds one from someone's details:

```ts
generateCurp({
  name: "Enrique",
  firstLastName: "Peña",
  secondLastName: "Nieto",
  birthDate: "1966-07-20",
  sex: "male",
  state: "Estado de México",
});
// "PXNE660720HMCXTN06"
```

It follows RENAPO's rules. Particles like "de la" are skipped. "María" and "José" give way to the second name when there is one. Ñ becomes X, and when the first four letters spell a rude word (PENE here) the second letter becomes X.

One catch: the 17th character is assigned by RENAPO to tell apart people who would otherwise get the same CURP. `generateCurp` uses `0` for people born before 2000 and `A` after, which is what nearly everyone gets, but a few people will have a different last two characters. Use it to pre-fill or double-check a form, not as the source of truth.

## RFC

Works for people (persona física, 13 characters) and companies (persona moral, 12), plus the generic `XAXX010101000` and `XEXX010101000`. You get the type, the date (birth or incorporation) and the homoclave.

The check digit is computed with SAT's algorithm and reported as `checkDigitMatches`, but it doesn't make the RFC invalid unless you pass `{ checkDigit: true }`. Some real RFCs, mostly old ones, don't match their own check digit, and rejecting them is worse than letting them through.

## CLABE

Checks the 18 digits and the check digit, and tells you the bank, plaza and account. The bank list comes from Banxico's SPEI participants (via [cuenca-mx/clabe](https://github.com/cuenca-mx/clabe-python)) and is exported as `BANKS`. If the bank code isn't in the list, the CLABE is still valid and `bank` is `null`, since new participants show up all the time.

`generateClabe("012", "180", "01234567890")` adds the check digit for you.

## NSS

The IMSS social security number. Checks the 11 digits and the check digit, and reads the subdelegation, the year the person signed up and their birth year.

## States and postal codes

```ts
stateFromPostalCode("42800"); // Hidalgo
findState("cdmx");            // { name: "Ciudad de México", curp: "DF", inegi: "09", iso: "MX-CMX", ... }
findState("Nuevo Leon");      // accents and case don't matter
findState(15);                // INEGI code, gives Estado de México
```

`STATES` has all 32 with their CURP, INEGI and ISO 3166-2 codes. Postal codes map to a state from their first two digits, so you get the state but not the municipality.

## Phone numbers

```ts
normalizePhone("+52 1 773 152 1627"); // "+527731521627"
normalizePhone("045 55 1234 5678");   // "+525512345678"
formatPhone("5512345678");            // "55 1234 5678"
formatPhone("7731521627", { international: true }); // "+52 773 152 1627"
```

It understands `+52`, `0052`, the old `+521` for mobiles and the old `01`, `044` and `045` prefixes. Mexico City, Guadalajara and Monterrey get two-digit area codes when formatting, everywhere else three.

## Amounts in words

```ts
amountToWords(21000.99);                    // "VEINTIÚN MIL PESOS 99/100 M.N."
amountToWords(1_000_000);                   // "UN MILLÓN DE PESOS 00/100 M.N."
amountToWords("$1,500.00", { currency: "USD" }); // "MIL QUINIENTOS DÓLARES 00/100 USD"
numberToWords(2026, { case: "lower" });      // "dos mil veintiséis"
```

Gets the tricky parts right: "un peso" vs "pesos", "veintiún mil", "ciento un", "un millón de pesos". Goes up to 999,999,999,999.99.

## License

MIT
