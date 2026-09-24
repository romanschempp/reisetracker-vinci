/**
 * ABN-Prüfsumme nach dem offiziellen Verfahren des ATO:
 * 1 von der ersten Ziffer abziehen, mit den Gewichten multiplizieren,
 * die Summe muss durch 89 teilbar sein.
 */
const WEIGHTS = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19];

export function normalizeAbn(input: string): string {
  return input.replace(/\D/g, '');
}

export function isValidAbn(input: string): boolean {
  const digits = normalizeAbn(input);
  if (digits.length !== 11) return false;
  const sum = [...digits].reduce((acc, ch, i) => {
    const d = Number(ch) - (i === 0 ? 1 : 0);
    return acc + d * WEIGHTS[i]!;
  }, 0);
  return sum % 89 === 0;
}

/** '51824753556' → '51 824 753 556' */
export function formatAbn(input: string): string {
  const d = normalizeAbn(input);
  if (d.length !== 11) return input;
  return `${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5, 8)} ${d.slice(8)}`;
}
