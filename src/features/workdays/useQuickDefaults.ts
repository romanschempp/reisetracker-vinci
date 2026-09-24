import { useLiveQuery } from 'dexie-react-hooks';
import { useEmployers } from '../../db/hooks';
import { lastCreatedWorkDay } from '../../db/repos/workDays';
import type { Employer } from '../../db/types';

export const DEFAULT_HOURS = 8;

/** Vorbelegung für die Schnelleingabe: Arbeitgeber und Stunden vom letzten Eintrag. */
export function useQuickDefaults(): { employer?: Employer; hours: number; loading: boolean } {
  const employers = useEmployers();
  const last = useLiveQuery(lastCreatedWorkDay, [], null);
  if (!employers || last === null) return { hours: DEFAULT_HOURS, loading: true };

  const fromLast = last ? employers.find((e) => e.id === last.employerId) : undefined;
  // Ohne letzten Eintrag: der zuletzt begonnene Arbeitgeber
  const employer = fromLast ?? employers[0];
  return { employer, hours: last && fromLast ? last.hours : DEFAULT_HOURS, loading: false };
}
