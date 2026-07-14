'use client';

import { useEffect, useRef } from 'react';

export default function ParallaxBinder({ targetSelector = '.it-brand-panel' }: { targetSelector?: string }) {
  const raf = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const el = document.querySelector<HTMLElement>(targetSelector);
    if (!el) return;

    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      if (
        e.clientX < rect.left || e.clientX > rect.right ||
        e.clientY < rect.top  || e.clientY > rect.bottom
      ) return;
      const x = (e.clientX - rect.left) / rect.width  - 0.5;
      const y = (e.clientY - rect.top)  / rect.height - 0.5;
      if (raf.current) cancelAnimationFrame(raf.current);
      raf.current = requestAnimationFrame(() => {
        el.style.setProperty('--px', `${(-x * 14).toFixed(2)}px`);
        el.style.setProperty('--py', `${(-y * 10).toFixed(2)}px`);
      });
    };

    const onLeave = () => {
      if (raf.current) cancelAnimationFrame(raf.current);
      el.style.setProperty('--px', '0px');
      el.style.setProperty('--py', '0px');
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    el.addEventListener('mouseleave', onLeave);
    return () => {
      window.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseleave', onLeave);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [targetSelector]);

  return null;
}
