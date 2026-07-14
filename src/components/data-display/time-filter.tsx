'use client';
import { cn } from '@/lib/utils';

interface TimeFilterProps {
  value: string;
  onChange: (period: string) => void;
  options?: string[];
}

const DEFAULT_OPTIONS = ['1M', '3M', '6M', '1Y', 'All'];

export function TimeFilter({ value, onChange, options = DEFAULT_OPTIONS }: TimeFilterProps) {
  return (
    <div className="flex items-center gap-1">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={cn(
            'px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer',
            value === opt
              ? 'bg-[rgba(24,104,150,0.10)] text-[#8B7355] border border-[rgba(24,104,150,0.18)]'
              : 'text-[var(--fg-muted)] hover:text-[var(--fg-secondary)] hover:bg-[var(--bg-secondary)] border border-transparent'
          )}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

/** Convert a period string to the number of data points to show. 0 = all. */
export function periodToCount(period: string): number {
  switch (period) {
    case '1M': return 1;
    case '3M': return 3;
    case '6M': return 6;
    case '1Y': return 12;
    default: return 0;
  }
}
