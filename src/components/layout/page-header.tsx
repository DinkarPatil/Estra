import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div className={cn('mb-6 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between', className)}>
      <div>
        <h1 className="text-2xl font-bold text-[var(--fg)] tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-[var(--fg-secondary)]">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export { PageHeader };
