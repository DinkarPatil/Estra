import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface DrawerSectionProps {
  title?: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: ReactNode;
  /** When true, renders children without the card wrapper (for custom layouts) */
  bare?: boolean;
  className?: string;
}

export function DrawerSection({ title, icon: Icon, children, bare, className }: DrawerSectionProps) {
  return (
    <div className={className}>
      {title && (
        <div className="flex items-center gap-2 mb-3">
          {Icon && <Icon className="h-3.5 w-3.5 text-[#8B7355]" />}
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--fg-muted)]">{title}</h3>
        </div>
      )}
      {bare ? (
        children
      ) : (
        <div className={cn('rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-light)] p-4')}>
          {children}
        </div>
      )}
    </div>
  );
}
