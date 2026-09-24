import type { ReactNode } from 'react';

export function PageHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <header className="flex min-h-16 items-end justify-between gap-4 pt-4 pb-3">
      <h1 className="font-sign text-title font-bold">{title}</h1>
      {action}
    </header>
  );
}
