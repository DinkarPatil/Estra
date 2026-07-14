import { cn } from '@/lib/utils';

interface ProgressProps {
  value: number;
  max?: number;
  className?: string;
  indicatorClassName?: string;
}

function Progress({ value, max = 100, className, indicatorClassName }: ProgressProps) {
  const percentage = Math.min((value / max) * 100, 100);
  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-[var(--bg-tertiary)]', className)}>
      <div
        className={cn('h-full rounded-full bg-gradient-to-r from-[#8B7355] to-[#8B7355] transition-all duration-500 shadow-[0_2px_8px_rgba(24,104,150,0.12)]', indicatorClassName)}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

export { Progress };
