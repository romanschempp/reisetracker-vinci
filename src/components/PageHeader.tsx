import type { ReactNode } from 'react';

export function PageHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <header className="flex min-h-20 items-end justify-between gap-4 pt-6 pb-5">
      <h1 className="text-[2.75rem] leading-none font-normal tracking-[-0.03em]">{title}</h1>
      {action}
    </header>
  );
}
