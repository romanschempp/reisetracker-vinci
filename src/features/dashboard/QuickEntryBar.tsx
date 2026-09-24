import { Link } from 'react-router';
import { formatHours } from '../../lib/format';
import { useQuickDefaults } from '../workdays/useQuickDefaults';
import { useWorkDaySheet } from '../workdays/WorkDaySheetProvider';

/** Großer Knopf im Daumenbereich: Ein Tipp öffnet die Eingabe mit den Werten vom letzten Mal. */
export function QuickEntryBar({ loggedToday }: { loggedToday: boolean }) {
  const sheet = useWorkDaySheet();
  const { employer, hours, loading } = useQuickDefaults();
  if (loading) return null;

  const wrap =
    'fixed inset-x-0 bottom-[calc(4rem+2px+env(safe-area-inset-bottom))] z-10 mx-auto max-w-xl px-4 pb-3 pt-2 bg-gradient-to-t from-paper from-70% to-transparent';

  if (!employer) {
    return (
      <div className={wrap}>
        <Link to="/arbeitgeber/neu" className="flex min-h-16 w-full items-center justify-center rounded-xl bg-stamp px-5 text-lg font-bold text-on-stamp shadow-md">
          Ersten Arbeitgeber anlegen
        </Link>
      </div>
    );
  }

  return (
    <div className={wrap}>
      <button
        type="button"
        onClick={() => sheet.openNew()}
        className="flex min-h-16 w-full flex-col items-start justify-center rounded-xl bg-stamp px-5 py-2 text-left text-on-stamp shadow-md active:brightness-90"
      >
        <span className="text-lg font-bold">{loggedToday ? 'Weiteren Tag erfassen' : 'Heute erfassen'}</span>
        <span className="text-small opacity-90">
          {employer.name}, {formatHours(hours)}
        </span>
      </button>
    </div>
  );
}
