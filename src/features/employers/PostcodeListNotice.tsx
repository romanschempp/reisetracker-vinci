import { Banner } from '../../components/Banner';
import { POSTCODE_LISTS } from '../../config/regionalPostcodes';
import type { WorkType } from '../../db/types';
import { missingLists } from '../../lib/regional';

/** Erinnert daran, dass die Regional-Prüfung erst mit gepflegten Listen greift. */
export function PostcodeListNotice({ workTypes }: { workTypes: WorkType[] }) {
  const missing = missingLists(workTypes);
  if (missing.length === 0) return null;
  const names = missing.map((k) => POSTCODE_LISTS[k].label).join(', ');
  return (
    <Banner tone="info">
      <p className="font-bold">Regional-Prüfung noch nicht aktiv</p>
      <p className="text-small">
        Die Postleitzahlenliste „{names}“ ist leer. Bis du sie in <code>src/config/regionalPostcodes.ts</code>{' '}
        einträgst, zählen diese Tage vorläufig mit.
      </p>
    </Banner>
  );
}
