import { cn } from '@/lib/utils';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

function ChartCard({ title, subtitle, children, action, className }: ChartCardProps) {
  return (
    <div className={cn(
      'premium-card rounded-2xl p-6',
      className
    )}>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-[15px] font-semibold text-[var(--fg)] tracking-[-0.01em]">{title}</h3>
          {subtitle && <p className="mt-1 text-[10px] uppercase tracking-[0.1em] text-[var(--fg-muted)]">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

export { ChartCard };
