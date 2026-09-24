import { describe, expect, it } from 'vitest';
import type { PostcodeList, PostcodeListKey } from '../config/regionalPostcodes';
import { missingLists, postcodeOnList, regionalStatus, statusCounts } from './regional';

// Testdaten – frei erfundene Nummern, keine offiziellen Listen.
const list = (postcodes: string[], ranges: [string, string][] = []): PostcodeList => ({
  label: 'Test',
  appliesTo: '',
  source: '',
  asOf: '',
  postcodes,
  ranges,
});

const lists: Record<PostcodeListKey, PostcodeList> = {
  regional: list(['4870'], [['2311', '2312'], ['2328', '2411']]),
  northernRemote: list(['0870']),
  disasterRecovery: list([]),
};

describe('postcodeOnList', () => {
  it('findet einzelne Postleitzahlen und Bereiche inklusive Grenzen', () => {
    expect(postcodeOnList('4870', lists.regional)).toBe(true);
    expect(postcodeOnList('2311', lists.regional)).toBe(true);
    expect(postcodeOnList('2411', lists.regional)).toBe(true);
    expect(postcodeOnList('2400', lists.regional)).toBe(true);
    expect(postcodeOnList('2313', lists.regional)).toBe(false);
  });

  it('lehnt ungültige Eingaben ab', () => {
    expect(postcodeOnList('231', lists.regional)).toBe(false);
    expect(postcodeOnList('abcd', lists.regional)).toBe(false);
  });
});

describe('regionalStatus', () => {
  it('prüft gegen die Liste, die zur Arbeitsart gehört', () => {
    expect(regionalStatus('4870', 'fruit-picking', lists)).toBe('regional');
    expect(regionalStatus('2000', 'farm', lists)).toBe('not-regional');
    // Tourismus nutzt eine andere Liste
    expect(regionalStatus('4870', 'tourism', lists)).toBe('not-regional');
    expect(regionalStatus('0870', 'tourism', lists)).toBe('regional');
  });

  it('meldet ungeprüft, solange die Liste leer ist', () => {
    expect(regionalStatus('3000', 'disaster-recovery', lists)).toBe('unchecked');
  });

  it('zählt Sonstiges nie', () => {
    expect(regionalStatus('4870', 'other', lists)).toBe('not-specified');
    expect(statusCounts('not-specified')).toBe(false);
    expect(statusCounts('not-regional')).toBe(false);
    expect(statusCounts('unchecked')).toBe(true);
  });

  it('nennt fehlende Listen', () => {
    expect(missingLists(['farm', 'disaster-recovery', 'other'], lists)).toEqual(['disasterRecovery']);
  });
});
