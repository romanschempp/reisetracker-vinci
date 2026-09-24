/**
 * Beträge wie auf australischen Payslips: $1,234.50.
 * Stunden wie im Deutschen: 7,5 h.
 */
const aud = new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' });
const hoursFmt = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 2 });

export function formatAUD(cents: number): string {
  return aud.format(cents / 100);
}

/** Akzeptiert '32.50', '32,50', '$32.50', '1,234.50' → Cent oder null. */
export function parseMoneyToCents(input: string): number | null {
  let s = input.replace(/[\s$A]/g, '');
  if (!s) return null;
  // Tausenderpunkte/-kommas entfernen, letztes Trennzeichen = Dezimaltrennzeichen
  const lastSep = Math.max(s.lastIndexOf(','), s.lastIndexOf('.'));
  if (lastSep !== -1 && s.length - lastSep - 1 <= 2) {
    s = s.slice(0, lastSep).replace(/[.,]/g, '') + '.' + s.slice(lastSep + 1);
  } else {
    s = s.replace(/[.,]/g, '');
  }
  if (!/^\d+(\.\d{0,2})?$/.test(s)) return null;
  return Math.round(Number(s) * 100);
}

/** Cent → Eingabetext für Formulare, z. B. 3250 → '32.50' */
export function centsToInput(cents: number): string {
  return (cents / 100).toFixed(2);
}

export function formatHours(hours: number): string {
  return `${hoursFmt.format(hours)} h`;
}

/** '7,5' oder '7.5' → 7.5; ungültig oder außerhalb 0–24 → null */
export function parseHours(input: string): number | null {
  const s = input.trim().replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(s)) return null;
  const h = Number(s);
  return h > 0 && h <= 24 ? h : null;
}

export function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}
