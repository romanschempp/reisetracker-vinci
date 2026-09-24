import { STATUS_LABELS, type RegionalStatus } from '../../lib/regional';

const COLORS: Record<RegionalStatus, string> = {
  regional: 'text-paddock',
  'not-regional': 'text-redpen',
  'not-specified': 'text-redpen',
  unchecked: 'text-muted',
};

/** Farbiges Quadrat + Text: die Farbe allein trägt nie die Information. */
export function RegionalStatusLabel({ status }: { status: RegionalStatus }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-small font-bold ${COLORS[status]}`}>
      <span className="size-2.5 rounded-sm bg-current" aria-hidden />
      {STATUS_LABELS[status]}
    </span>
  );
}
