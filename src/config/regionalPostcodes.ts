/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  POSTLEITZAHLEN FÜR „SPECIFIED WORK“ – BITTE SELBST PFLEGEN
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Diese Listen sind absichtlich leer. Trag hier die offiziellen Postleitzahlen
 *  von Home Affairs ein:
 *
 *    https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/work-holiday-417/specified-work
 *
 *  Solange eine Liste leer ist, zeigt die App „ungeprüft“ an und zählt die Tage
 *  vorläufig mit. Sobald eine Liste befüllt ist, wird streng geprüft.
 *
 *  Format:
 *    postcodes: einzelne Postleitzahlen            ['2311', '2312']
 *    ranges:    Bereiche inkl. Grenzen (wie auf der Website)  [['2311', '2312'], ['2328', '2411']]
 *
 *  Trag bei `source` die genaue URL und bei `asOf` das Datum ein, an dem du die
 *  Liste abgeschrieben hast. Die Listen ändern sich gelegentlich.
 */

export interface PostcodeList {
  label: string;
  /** Welche Arbeit auf dieser Liste geprüft wird – nur zur Orientierung. */
  appliesTo: string;
  source: string;
  asOf: string; // 'YYYY-MM-DD'
  postcodes: string[];
  ranges: [from: string, to: string][];
}

export const POSTCODE_LISTS = {
  regional: {
    label: 'Regional Australia',
    appliesTo: 'Pflanzen- und Tieranbau, Fischerei, Forstwirtschaft, Bergbau, Bau',
    source: '',
    asOf: '',
    postcodes: [],
    ranges: [],
  },
  northernRemote: {
    label: 'Northern Australia / Remote & Very Remote',
    appliesTo: 'Tourismus und Gastronomie',
    source: '',
    asOf: '',
    postcodes: [],
    ranges: [],
  },
  disasterRecovery: {
    label: 'Bushfire- und Flood-Recovery-Gebiete',
    appliesTo: 'Aufbauarbeit nach Buschfeuer oder Flut',
    source: '',
    asOf: '',
    postcodes: [],
    ranges: [],
  },
} satisfies Record<string, PostcodeList>;

export type PostcodeListKey = keyof typeof POSTCODE_LISTS;
