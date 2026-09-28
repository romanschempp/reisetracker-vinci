import type { ReactNode } from 'react';

/** Kleines Etikett als Milchglas-Pille, z. B. über einem Abschnitt. */
export function Tag({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex min-h-7 items-center rounded-full border border-current/15 bg-current/8 px-3.5 text-small font-medium backdrop-blur-xl ${className}`}
    >
      {children}
    </span>
  );
}
