'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const SIZE_CLASSES = {
  sm: 'sm:max-w-[420px]',
  md: 'sm:max-w-[480px]',
  lg: 'sm:max-w-[520px]',
  xl: 'sm:max-w-[560px]',
} as const;

export interface AppDrawerProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  size?: keyof typeof SIZE_CLASSES;
  className?: string;
}

export function AppDrawer({ open, onClose, children, size = 'lg', className }: AppDrawerProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  /* ESC key close */
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  /* Scroll lock on <main> */
  useEffect(() => {
    if (!open) return;
    const main = document.querySelector('main');
    if (main) (main as HTMLElement).style.overflow = 'hidden';
    return () => {
      if (main) (main as HTMLElement).style.overflow = '';
    };
  }, [open]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[999]">
          {/* Backdrop */}
          <motion.div
            key="drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="absolute inset-0 bg-black/35 backdrop-blur-[6px]"
            onClick={onClose}
          />
          {/* Floating Panel */}
          <motion.div
            key="drawer-panel"
            initial={{ x: 40, opacity: 0, scale: 0.98 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            exit={{ x: 40, opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', damping: 32, stiffness: 340, mass: 0.8 }}
            className={cn(
              /* Floating position — margin from all edges */
              'absolute z-[1000] w-full max-w-full',
              /* Desktop: floating with margins */
              'sm:right-4 sm:top-3 sm:bottom-3',
              /* Mobile: full-screen sheet */
              'right-0 top-0 bottom-0',
              SIZE_CLASSES[size],
              /* Surface */
              'bg-[var(--bg-elevated)]',
              'border border-[var(--border)]',
              /* Premium layered shadow */
              'shadow-[0_8px_40px_rgba(0,0,0,0.12),0_2px_12px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.04)]',
              /* Shape */
              'flex flex-col overflow-hidden',
              'sm:rounded-3xl rounded-none',
              className,
            )}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
