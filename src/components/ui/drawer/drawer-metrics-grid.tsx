import { cn } from '@/lib/utils';

export interface MetricItem {
  label: string;
  value: string;
  color?: string;
  icon?: React.ComponentType<{ className?: string }>;
  highlight?: boolean;
}

export interface DrawerMetricsGridProps {
  metrics: MetricItem[];
  columns?: 2 | 3;
  className?: string;
}

export function DrawerMetricsGrid({ metrics, columns = 2, className }: DrawerMetricsGridProps) {
  return (
    <div className={cn('grid gap-3', columns === 3 ? 'grid-cols-3' : 'grid-cols-2', className)}>
      {metrics.map(item => {
        const Icon = item.icon;
        return (
          <div key={item.label} className="rounded-xl border border-[var(--border-light)] bg-[var(--bg-secondary)] p-3.5">
            {Icon ? (
              <div className="flex items-center gap-1.5 mb-1.5">
                <Icon className={cn('h-3 w-3', item.highlight ? 'text-[#8B7355]' : 'text-[var(--fg-muted)]')} />
                <p className="text-[9px] uppercase tracking-wider text-[var(--fg-muted)]">{item.label}</p>
              </div>
            ) : (
              <p className="text-[10px] uppercase tracking-wider text-[var(--fg-muted)]">{item.label}</p>
            )}
            <p
              className={cn('text-lg font-bold mt-1', item.highlight && !item.color ? 'text-[#8B7355]' : 'text-[var(--fg)]')}
              style={item.color ? { color: item.color } : undefined}
            >
              {item.value}
            </p>
          </div>
        );
      })}
    </div>
  );
}
