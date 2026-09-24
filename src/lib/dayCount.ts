import type { Employer, WorkDay } from '../db/types';
import { addDays, daysBetween, isWithin, startOfWeek, type ISODate } from './dates';
import { regionalStatus, statusCounts, type RegionalStatus } from './regional';

/** Arbeitstage in einer Woche, ab denen eine Vollzeitwoche als 7 Tage zählt. */
export const FULL_TIME_MIN_DAYS_PER_WEEK = 5;

export interface DayCount {
  /** Kalendertage mit anrechenbarer Arbeit – jeder Tag nur einmal. */
  worked: number;
  /** worked + Wochenendtage aus vollen Vollzeitwochen */
  credited: number;
  /** credited − worked */
  fromFullTimeWeeks: number;
  /** Tage, an denen nur bei nicht anrechenbaren Arbeitgebern gearbeitet wurde. */
  notCounted: number;
  workedDates: Set<ISODate>;
  creditedDates: Set<ISODate>;
}

export type StatusOf = (employer: Employer) => RegionalStatus;

const defaultStatusOf: StatusOf = (e) => regionalStatus(e.postcode, e.workType);

/**
 * Zählt die Tage für das Second-Year-Visum.
 *
 * Grundregel: Jeder Kalendertag mit Arbeit bei einem anrechenbaren Arbeitgeber
 * zählt genau einmal, egal wie viele Einträge es an dem Tag gibt.
 *
 * Vollzeitregel (nur für Arbeitgeber mit fullTime = true): Hast du in einer
 * Woche (Mo–So) an mindestens 5 Tagen dort gearbeitet, zählt die ganze Woche
 * als 7 Tage – aber nur innerhalb deiner Beschäftigungsdauer und nicht über
 * heute hinaus.
 */
export function countDays(
  workDays: WorkDay[],
  employers: Employer[],
  today: ISODate,
  statusOf: StatusOf = defaultStatusOf,
): DayCount {
  const employerById = new Map(employers.filter((e) => !e.deletedAt).map((e) => [e.id, e]));
  const workedDates = new Set<ISODate>();
  const otherDates = new Set<ISODate>();
  // employerId → Wochenbeginn → Arbeitstage in der Woche
  const fullTimeWeeks = new Map<string, Map<ISODate, Set<ISODate>>>();

  for (const day of workDays) {
    if (day.deletedAt) continue;
    const employer = employerById.get(day.employerId);
    if (!employer) continue;

    if (!statusCounts(statusOf(employer))) {
      otherDates.add(day.date);
      continue;
    }
    workedDates.add(day.date);

    if (employer.fullTime) {
      const weeks = fullTimeWeeks.get(employer.id) ?? new Map<ISODate, Set<ISODate>>();
      const week = startOfWeek(day.date);
      const dates = weeks.get(week) ?? new Set<ISODate>();
      dates.add(day.date);
      weeks.set(week, dates);
      fullTimeWeeks.set(employer.id, weeks);
    }
  }

  const creditedDates = new Set(workedDates);
  for (const [employerId, weeks] of fullTimeWeeks) {
    const employer = employerById.get(employerId)!;
    for (const [monday, dates] of weeks) {
      if (dates.size < FULL_TIME_MIN_DAYS_PER_WEEK) continue;
      for (let i = 0; i < 7; i++) {
        const date = addDays(monday, i);
        if (date <= today && isWithin(date, employer.startDate, employer.endDate)) {
          creditedDates.add(date);
        }
      }
    }
  }

  let notCounted = 0;
  for (const date of otherDates) if (!creditedDates.has(date)) notCounted++;

  return {
    worked: workedDates.size,
    credited: creditedDates.size,
    fromFullTimeWeeks: creditedDates.size - workedDates.size,
    notCounted,
    workedDates,
    creditedDates,
  };
}

/**
 * Grobe Prognose, wann das Ziel erreicht ist – im bisherigen Tempo seit dem
 * ersten gezählten Tag. Erst ab 5 Tagen, vorher ist das Tempo nicht aussagekräftig.
 */
export function estimateFinish(creditedDates: Set<ISODate>, target: number, today: ISODate): ISODate | null {
  const done = [...creditedDates].filter((d) => d <= today).sort();
  const remaining = target - done.length;
  if (remaining <= 0 || done.length < 5) return null;
  const span = daysBetween(done[0]!, today) + 1;
  const perDay = done.length / span;
  return addDays(today, Math.ceil(remaining / perDay));
}
