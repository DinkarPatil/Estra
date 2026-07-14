import { cn } from '@/lib/utils';
import { type LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  change?: number;
  changeLabel?: string;
  icon: LucideIcon;
  iconColor?: string;
  className?: string;
}

function StatCard({ title, value, change, changeLabel, icon: Icon, className }: StatCardProps) {
  return (
    <div className={cn(
      'premium-card rounded-2xl p-6 group',
      className
    )}>
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--fg-muted)]">{title}</p>
        <div className="glow-icon-container">
          <Icon className="h-5 w-5 text-[var(--accent)]" />
        </div>
      </div>
      <div className="mt-4">
        <p className="text-[28px] font-bold text-[var(--fg)] tracking-[-0.025em] glm-metric-value">{value}</p>
        {change !== undefined && (
          <div className="mt-2 flex items-center gap-1.5 text-sm">
            {change >= 0 ? (
              <div className="flex items-center gap-1 rounded-full bg-[rgba(34,197,94,0.1)] px-2 py-0.5">
                <TrendingUp className="h-3.5 w-3.5 text-[#4ADE80]" />
                <span className="text-xs font-medium text-[#4ADE80]">
                  +{change.toFixed(1)}%
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1 rounded-full bg-[rgba(239,68,68,0.1)] px-2 py-0.5">
                <TrendingDown className="h-3.5 w-3.5 text-[#F87171]" />
                <span className="text-xs font-medium text-[#F87171]">
                  {change.toFixed(1)}%
                </span>
              </div>
            )}
            {changeLabel && <span className="text-xs text-[var(--fg-muted)]">{changeLabel}</span>}
          </div>
        )}
      </div>
    </div>
  );
}

export { StatCard };
