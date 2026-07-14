'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const GREEN = '#22C55E';
const BRAND = '#8B7355';
const RED = '#EF4444';

export interface DrawerProgressBarProps {
  label: string;
  value: number;
  description?: string;
  /** Override auto-detected bar color */
  color?: string;
  className?: string;
}

export function DrawerProgressBar({ label, value, description, color, className }: DrawerProgressBarProps) {
  const barColor = color || (value >= 80 ? GREEN : value >= 40 ? BRAND : RED);

  return (
    <div className={cn('rounded-xl border border-[var(--border-light)] bg-[var(--bg-secondary)] p-4', className)}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-[var(--fg-secondary)]">{label}</p>
        <p className="text-sm font-bold" style={{ color: barColor }}>{value}%</p>
      </div>
      <div className="h-2.5 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: barColor }}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
      {description && <p className="text-[10px] text-[var(--fg-muted)] mt-2">{description}</p>}
    </div>
  );
}
