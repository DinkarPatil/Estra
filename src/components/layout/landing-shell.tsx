'use client';
import type { ElementType, ReactNode, CSSProperties } from 'react';
import { cn } from '@/lib/utils';

interface LandingShellProps<T extends ElementType = 'div'> {
  as?: T;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

/**
 * Single-source-of-truth container for the public landing page.
 *
 * Renders an element with `.lp-container` (max-width 75rem / 1200px,
 * fluid `clamp()` horizontal padding, `margin-inline: auto`). Every
 * layout-edge surface — nav, hero, sections, ticker, separators,
 * footer — wraps its content in <LandingShell> so left/right edges
 * align identically at every zoom level.
 *
 * Use the `as` prop to render semantic elements:
 *   <LandingShell as="nav">…</LandingShell>
 *   <LandingShell as="section">…</LandingShell>
 *   <LandingShell as="footer">…</LandingShell>
 */
export function LandingShell<T extends ElementType = 'div'>({
  as,
  children,
  className,
  style,
}: LandingShellProps<T>) {
  const Tag = (as ?? 'div') as ElementType;
  return (
    <Tag className={cn('lp-container', className)} style={style}>
      {children}
    </Tag>
  );
}
