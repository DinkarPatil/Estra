'use client';
import * as React from 'react';
import { cn } from '@/lib/utils';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  side?: 'top' | 'bottom';
  className?: string;
}

function Tooltip({ content, children, side = 'top', className }: TooltipProps) {
  const [show, setShow] = React.useState(false);
  return (
    <div className="relative inline-flex" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <div
          className={cn(
            'absolute z-50 whitespace-nowrap rounded-md bg-[var(--fg)] px-2 py-1 text-xs text-[var(--bg)] shadow-md animate-fade-in',
            side === 'top' ? 'bottom-full left-1/2 mb-2 -translate-x-1/2' : 'top-full left-1/2 mt-2 -translate-x-1/2',
            className
          )}
        >
          {content}
        </div>
      )}
    </div>
  );
}

export { Tooltip };
