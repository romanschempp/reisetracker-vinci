import { Link } from 'react-router';
import { formatHours } from '../../lib/format';
import { useQuickDefaults } from '../workdays/useQuickDefaults';
import { useWorkDaySheet } from '../workdays/WorkDaySheetProvider';

function ArrowDisc({ icon, small = false }: { icon: 'plus' | 'arrow'; small?: boolean }) {
  return (
    <span className={`flex ${small ? 'size-11' : 'size-12'} shrink-0 items-center justify-center rounded-full bg-[#141414] text-white`} aria-hidden>
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        {icon === 'plus' ? <path d="M12 5v14M5 12h14" /> : <path d="M7 17 17 7M9 7h8v8" />}
      </svg>
    </span>
  );
}

/** Großer Knopf im Daumenbereich: Ein Tipp öffnet die Eingabe mit den Werten vom letzten Mal. */
export function QuickEntryBar({ loggedToday }: { loggedToday: boolean }) {
  const sheet = useWorkDaySheet();
  const { employer, hours, loading } = useQuickDefaults();
  if (loading) return null;

  const wrap =
    'fixed inset-x-0 bottom-[calc(4rem+max(0.5rem,env(safe-area-inset-bottom)))] z-10 mx-auto max-w-xl px-3 pb-2 pt-6 bg-gradient-to-t from-paper from-60% to-transparent lg:hidden';
  const pill =
    'flex min-h-16 w-full items-center justify-between gap-3 rounded-full bg-hivis py-2 pr-2 pl-6 text-left text-on-hivis transition-[filter,scale] duration-150 active:scale-[0.98] active:brightness-95';

  if (!employer) {
    return (
      <div className={wrap}>
        <Link to="/arbeitgeber/neu" className={pill}>
          <span className="text-lg font-medium">Ersten Arbeitgeber anlegen</span>
          <ArrowDisc icon="arrow" />
        </Link>
      </div>
    );
  }

  return (
    <div className={wrap}>
      <button type="button" onClick={() => sheet.openNew()} className={pill}>
        <span className="flex min-w-0 flex-col">
          <span className="text-lg leading-tight font-medium">{loggedToday ? 'Weiteren Tag erfassen' : 'Heute erfassen'}</span>
          <span className="truncate text-small opacity-70">
            {employer.name}, {formatHours(hours)}
          </span>
        </span>
        <ArrowDisc icon="plus" />
      </button>
    </div>
  );
}

/** Dieselbe Schnelleingabe als Knopf in der Seitenleiste am Laptop – von jeder Seite aus erreichbar. */
export function SideEntryButton() {
  const sheet = useWorkDaySheet();
  const { employer, hours, loading } = useQuickDefaults();
  if (loading) return null;

  const pill =
    'flex min-h-14 w-full items-center justify-between gap-2 rounded-full bg-hivis py-1.5 pr-1.5 pl-5 text-left text-on-hivis transition-[filter] duration-150 hover:brightness-105 active:brightness-95';

  if (!employer) {
    return (
      <Link to="/arbeitgeber/neu" className={pill}>
        <span className="font-medium leading-tight">Arbeitgeber anlegen</span>
        <ArrowDisc icon="arrow" small />
      </Link>
    );
  }

  return (
    <button type="button" onClick={() => sheet.openNew()} className={pill}>
      <span className="flex min-w-0 flex-col">
        <span className="font-medium leading-tight">Tag erfassen</span>
        <span className="truncate text-[0.75rem] opacity-65">
          {employer.name}, {formatHours(hours)}
        </span>
      </span>
      <ArrowDisc icon="plus" small />
    </button>
  );
}
