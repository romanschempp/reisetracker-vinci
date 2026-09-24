import type { ReactNode } from 'react';

type Tone = 'warn' | 'ok' | 'info';

const TONES: Record<Tone, string> = {
  warn: 'bg-redpen-wash',
  ok: 'bg-paddock-wash',
  info: 'bg-sage',
};

const DOTS: Record<Tone, string> = {
  warn: 'bg-redpen',
  ok: 'bg-paddock',
  info: 'bg-ink',
};

/** Hinweis als Kachel mit Punkt: rot = Achtung, grün = in Ordnung, salbei = Info. */
export function Banner({ tone, children, role }: { tone: Tone; children: ReactNode; role?: 'alert' | 'status' }) {
  return (
    <div role={role} className={`flex gap-3 rounded-3xl px-5 py-4 ${TONES[tone]}`}>
      <span className={`mt-2 size-2 shrink-0 rounded-full ${DOTS[tone]}`} aria-hidden />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
