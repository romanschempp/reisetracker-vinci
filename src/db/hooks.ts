import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo } from 'react';
import { countDays } from '../lib/dayCount';
import { todayISO } from '../lib/dates';
import { getEmployer, listEmployers } from './repos/employers';
import { listPhotos, listPlaces, photoCounts } from './repos/places';
import { getSettings } from './repos/settings';
import { listWorkDays } from './repos/workDays';

// undefined = lädt noch

export const useEmployers = () => useLiveQuery(listEmployers);
export const useWorkDays = () => useLiveQuery(listWorkDays);
export const useSettings = () => useLiveQuery(getSettings);
export const useEmployer = (id: string | undefined) =>
  useLiveQuery(() => (id ? getEmployer(id) : undefined), [id]);

export function useDayCount() {
  const employers = useEmployers();
  const workDays = useWorkDays();
  const today = todayISO();
  return useMemo(
    () => (employers && workDays ? countDays(workDays, employers, today) : undefined),
    [employers, workDays, today],
  );
}

export const usePlaces = () => useLiveQuery(listPlaces);
export const usePhotos = (placeId: string | undefined) =>
  useLiveQuery(() => (placeId ? listPhotos(placeId) : []), [placeId]);
export const usePhotoCounts = () => useLiveQuery(photoCounts);
