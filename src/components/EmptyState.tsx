import type { ReactNode } from 'react';

interface Props {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  /** Ohne großen Abstand oben, z. B. neben der Karte */
  compact?: boolean;
}

export function EmptyState({ title, children, action, compact = false }: Props) {
  return (
    <div className={`flex max-w-xl flex-col items-start gap-3 ${compact ? 'pb-10' : 'py-10'}`}>
      <h2 className="text-title font-normal tracking-tight">{title}</h2>
      {children && <p className="max-w-prose text-muted">{children}</p>}
      {action}
    </div>
  );
}
