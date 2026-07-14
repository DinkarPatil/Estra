import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface DrawerFooterProps {
  children: ReactNode;
  className?: string;
}

export function DrawerFooter({ children, className }: DrawerFooterProps) {
  return (
    <div className={cn(
      'flex items-center gap-3 px-6 py-4 border-t border-[var(--border)] bg-[var(--bg-elevated)] flex-shrink-0',
      className,
    )}>
      {children}
    </div>
  );
}
