'use client';
import * as React from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

function Dialog({ open, onClose, children, size = 'lg' }: DialogProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Lock the actual scroll container (<main>) not just body
  React.useEffect(() => {
    if (!open) return;
    const main = document.querySelector('main');
    if (main) (main as HTMLElement).style.overflow = 'hidden';
    return () => {
      if (main) (main as HTMLElement).style.overflow = '';
    };
  }, [open]);

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Panel */}
      <div
        className={cn(
          'relative z-[1001] w-full animate-scale-in rounded-3xl bg-[var(--bg-elevated)]',
          'border border-[var(--border)] p-6 shadow-[0_25px_60px_-12px_rgba(0,0,0,0.3)]',
          'max-h-[85vh] overflow-y-auto',
          sizeClasses[size],
        )}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 opacity-60 transition-opacity hover:opacity-100 hover:bg-[var(--bg-secondary)] cursor-pointer"
        >
          <X className="h-4 w-4 text-[var(--fg)]" />
        </button>
        {children}
      </div>
    </div>,
    document.body,
  );
}

function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mb-4 space-y-1.5', className)} {...props} />;
}

function DialogTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn('text-lg font-semibold text-[var(--fg)]', className)} {...props} />;
}

function DialogDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm text-[var(--fg-secondary)]', className)} {...props} />;
}

export { Dialog, DialogHeader, DialogTitle, DialogDescription };
