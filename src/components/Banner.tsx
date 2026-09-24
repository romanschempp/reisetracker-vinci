import type { ReactNode } from 'react';

type Tone = 'warn' | 'ok' | 'info';

const TONES: Record<Tone, string> = {
  warn: 'bg-redpen-wash border-redpen',
  ok: 'bg-paddock-wash border-paddock',
  info: 'bg-stamp-wash border-stamp',
};

/** Hinweis mit farbiger Kante: rot = Achtung, grün = in Ordnung, blau = Info. */
export function Banner({ tone, children, role }: { tone: Tone; children: ReactNode; role?: 'alert' | 'status' }) {
  return (
    <div role={role} className={`rounded-lg border-l-4 px-4 py-3 ${TONES[tone]}`}>
      {children}
    </div>
  );
}
