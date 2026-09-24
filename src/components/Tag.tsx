import type { ReactNode } from 'react';

/** Kleines umrandetes Etikett in Großbuchstaben, z. B. über einem Abschnitt. */
export function Tag({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex min-h-7 items-center rounded-full border border-current/35 px-3 text-[0.6875rem] font-medium tracking-[0.08em] uppercase ${className}`}
    >
      {children}
    </span>
  );
}
