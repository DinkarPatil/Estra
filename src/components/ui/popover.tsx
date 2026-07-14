'use client';
import { useState, useRef, useCallback, useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useClickOutside } from '@/hooks/use-click-outside';
import { cn } from '@/lib/utils';

interface PopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: ReactNode;
  children: ReactNode;
  align?: 'start' | 'center' | 'end';
  sideOffset?: number;
  className?: string;
}

export function Popover({
  open,
  onOpenChange,
  trigger,
  children,
  align = 'end',
  sideOffset = 8,
  className,
}: PopoverProps) {
  const triggerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const contentWidth = contentRef.current?.offsetWidth || 320;

    let left: number;
    if (align === 'end') {
      left = rect.right - contentWidth;
    } else if (align === 'center') {
      left = rect.left + rect.width / 2 - contentWidth / 2;
    } else {
      left = rect.left;
    }

    // Clamp to viewport
    left = Math.max(8, Math.min(left, window.innerWidth - contentWidth - 8));

    setPosition({
      top: rect.bottom + sideOffset,
      left,
    });
  }, [align, sideOffset]);

  useEffect(() => {
    if (open) {
      updatePosition();
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', () => onOpenChange(false), { once: true });
    }
    return () => {
      window.removeEventListener('resize', updatePosition);
    };
  }, [open, updatePosition, onOpenChange]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onOpenChange(false);
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onOpenChange]);

  useClickOutside([triggerRef, contentRef], () => onOpenChange(false), open);

  return (
    <>
      <div ref={triggerRef} className="inline-flex" onClick={() => onOpenChange(!open)}>
        {trigger}
      </div>
      {open && mounted && createPortal(
        <div
          ref={contentRef}
          className={cn('popover-panel fixed z-[100]', className)}
          style={{ top: position.top, left: position.left }}
          role="menu"
        >
          {children}
        </div>,
        document.body
      )}
    </>
  );
}
