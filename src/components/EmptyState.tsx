import type { ReactNode } from 'react';

export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-3 py-10">
      <h2 className="font-sign text-title font-bold">{title}</h2>
      {children && <p className="max-w-prose text-muted">{children}</p>}
      {action}
    </div>
  );
}
