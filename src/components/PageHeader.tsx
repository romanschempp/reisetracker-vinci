import type { ReactNode } from 'react';

export function PageHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <header className="flex min-h-20 flex-wrap items-end justify-between gap-x-4 gap-y-3 pt-6 pb-5 lg:pt-12 lg:pb-8">
      <h1 className="text-[2.75rem] leading-none font-normal tracking-[-0.03em] text-balance lg:text-[3.5rem]">{title}</h1>
      {action}
    </header>
  );
}
