import { POSTCODE_LISTS, type PostcodeList, type PostcodeListKey } from '../config/regionalPostcodes';
import type { WorkType } from '../db/types';

export const WORK_TYPE_LABELS: Record<WorkType, string> = {
  farm: 'Farmarbeit',
  'fruit-picking': 'Fruit Picking',
  packing: 'Packing (auf der Farm)',
  animal: 'Tierhaltung',
  fishing: 'Fischerei & Perlenzucht',
  forestry: 'Forstwirtschaft',
  mining: 'Bergbau',
  construction: 'Bau',
  tourism: 'Tourismus & Gastronomie',
  'disaster-recovery': 'Aufbau nach Buschfeuer/Flut',
  other: 'Sonstiges (keine specified work)',
};

/** Welche Postleitzahlenliste für welche Arbeit gilt. null = zählt nie. */
export const WORK_TYPE_LIST: Record<WorkType, PostcodeListKey | null> = {
  farm: 'regional',
  'fruit-picking': 'regional',
  packing: 'regional',
  animal: 'regional',
  fishing: 'regional',
  forestry: 'regional',
  mining: 'regional',
  construction: 'regional',
  tourism: 'northernRemote',
  'disaster-recovery': 'disasterRecovery',
  other: null,
};

/**
 * regional      – Postleitzahl steht auf der passenden Liste
 * not-regional  – Liste ist gepflegt, Postleitzahl fehlt darauf
 * not-specified – Arbeitsart zählt grundsätzlich nicht
 * unchecked     – Liste noch leer, Prüfung nicht möglich (Tage zählen vorläufig)
 */
export type RegionalStatus = 'regional' | 'not-regional' | 'not-specified' | 'unchecked';

export function isValidPostcode(postcode: string): boolean {
  return /^\d{4}$/.test(postcode);
}

export function listIsEmpty(list: PostcodeList): boolean {
  return list.postcodes.length === 0 && list.ranges.length === 0;
}

export function postcodeOnList(postcode: string, list: PostcodeList): boolean {
  if (!isValidPostcode(postcode)) return false;
  if (list.postcodes.includes(postcode)) return true;
  const n = Number(postcode);
  return list.ranges.some(([from, to]) => n >= Number(from) && n <= Number(to));
}

export function regionalStatus(
  postcode: string,
  workType: WorkType,
  lists: Record<PostcodeListKey, PostcodeList> = POSTCODE_LISTS,
): RegionalStatus {
  const key = WORK_TYPE_LIST[workType];
  if (key === null) return 'not-specified';
  const list = lists[key];
  if (listIsEmpty(list)) return 'unchecked';
  return postcodeOnList(postcode, list) ? 'regional' : 'not-regional';
}

/** Zählen Tage bei diesem Status für den Fortschritt? */
export function statusCounts(status: RegionalStatus): boolean {
  return status === 'regional' || status === 'unchecked';
}

export const STATUS_LABELS: Record<RegionalStatus, string> = {
  regional: 'Regional',
  'not-regional': 'Nicht regional',
  'not-specified': 'Keine specified work',
  unchecked: 'Ungeprüft',
};

/** Leere Listen, die für die angegebenen Arbeitsarten gebraucht würden. */
export function missingLists(
  workTypes: WorkType[],
  lists: Record<PostcodeListKey, PostcodeList> = POSTCODE_LISTS,
): PostcodeListKey[] {
  const keys = new Set<PostcodeListKey>();
  for (const t of workTypes) {
    const key = WORK_TYPE_LIST[t];
    if (key && listIsEmpty(lists[key])) keys.add(key);
  }
  return [...keys];
}
