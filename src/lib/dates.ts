/**
 * Kalenderdaten werden überall als 'YYYY-MM-DD' gespeichert – nie als Date-Objekt.
 * Ein Arbeitstag ist ein Kalendertag vor Ort, keine Uhrzeit; so verschiebt keine
 * Zeitzone (Deutschland ↔ Australien) einen Tag.
 * Gerechnet wird intern in UTC, weil es dort keine Sommerzeit-Sprünge gibt.
 */
export type ISODate = string;

const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const DAY_MS = 86_400_000;

export function isISODate(value: string): value is ISODate {
  const m = ISO_RE.exec(value);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(Date.UTC(y, mo - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === mo - 1 && date.getUTCDate() === d;
}

function toUTC(iso: ISODate): number {
  const m = ISO_RE.exec(iso);
  if (!m) throw new Error(`Ungültiges Datum: ${iso}`);
  return Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

function fromUTC(ms: number): ISODate {
  return new Date(ms).toISOString().slice(0, 10);
}

/** Heutiges Datum nach der Uhr des Geräts (also die Ortszeit, in der du gerade bist). */
export function todayISO(now: Date = new Date()): ISODate {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDays(iso: ISODate, days: number): ISODate {
  return fromUTC(toUTC(iso) + days * DAY_MS);
}

/** Anzahl Tage von a nach b (b − a). */
export function daysBetween(a: ISODate, b: ISODate): number {
  return Math.round((toUTC(b) - toUTC(a)) / DAY_MS);
}

/** 0 = Montag … 6 = Sonntag */
export function weekdayIndex(iso: ISODate): number {
  return (new Date(toUTC(iso)).getUTCDay() + 6) % 7;
}

/** Montag der Woche, in der iso liegt. */
export function startOfWeek(iso: ISODate): ISODate {
  return addDays(iso, -weekdayIndex(iso));
}

export function weekDates(iso: ISODate): ISODate[] {
  const monday = startOfWeek(iso);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

const WEEKDAYS_SHORT = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'] as const;

export function weekdayShort(iso: ISODate): string {
  return WEEKDAYS_SHORT[weekdayIndex(iso)]!;
}

/** '2026-11-03' → '03.11.2026' */
export function formatDate(iso: ISODate): string {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

/** '2026-11-03' → 'Di, 03.11.2026' */
export function formatDateWithWeekday(iso: ISODate): string {
  return `${weekdayShort(iso)}, ${formatDate(iso)}`;
}

/** Relativ zu heute: 'Heute', 'Gestern' oder 'Di, 03.11.2026' */
export function formatDateRelative(iso: ISODate, today: ISODate = todayISO()): string {
  const diff = daysBetween(iso, today);
  if (diff === 0) return `Heute, ${formatDate(iso)}`;
  if (diff === 1) return `Gestern, ${formatDate(iso)}`;
  return formatDateWithWeekday(iso);
}

export function isWithin(iso: ISODate, start: ISODate, end?: ISODate): boolean {
  return iso >= start && (end === undefined || iso <= end);
}

const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

/** Monat als 'YYYY-MM' */
export type ISOMonth = string;

export function monthOf(iso: ISODate): ISOMonth {
  return iso.slice(0, 7);
}

/** '2026-09' → 'September 2026' (nimmt auch ein volles Datum) */
export function monthLabel(isoOrMonth: string): string {
  const [y, m] = isoOrMonth.split('-');
  return `${MONTHS[Number(m) - 1]} ${y}`;
}

export function addMonths(month: ISOMonth, delta: number): ISOMonth {
  const [y, m] = month.split('-').map(Number);
  const total = y! * 12 + (m! - 1) + delta;
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, '0')}`;
}

/**
 * Kalenderraster eines Monats, Wochen beginnen am Montag.
 * Leere Felder vor dem 1. sind null, damit der Monat an der richtigen Spalte beginnt.
 */
export function monthGrid(month: ISOMonth): (ISODate | null)[] {
  const first = `${month}-01`;
  const days = daysBetween(first, `${addMonths(month, 1)}-01`);
  const lead: null[] = Array.from({ length: weekdayIndex(first) }, () => null);
  return [...lead, ...Array.from({ length: days }, (_, i) => addDays(first, i))];
}
