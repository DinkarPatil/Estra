'use client';

import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DrawerHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  logo?: ReactNode;
  onClose: () => void;
  actions?: ReactNode;
  className?: string;
}

export function DrawerHeader({ title, subtitle, icon, logo, onClose, actions, className }: DrawerHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-[var(--bg-elevated)] flex-shrink-0', className)}>
      <div className="flex items-center gap-3 min-w-0">
        {logo ? (
          <div className="flex-shrink-0">{logo}</div>
        ) : (
          icon && (
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#8B7355]/20 to-[#8B7355]/10 border border-[#8B7355]/15 flex items-center justify-center flex-shrink-0">
              {icon}
            </div>
          )
        )}
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold text-[var(--fg)] truncate">{title}</h2>
          {subtitle && <p className="text-[11px] text-[var(--fg-muted)] truncate">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {actions}
        <button
          onClick={onClose}
          className="drawer-close-btn cursor-pointer"
        >
          <X className="h-4 w-4" strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}
