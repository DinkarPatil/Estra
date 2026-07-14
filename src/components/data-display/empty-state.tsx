import { cn } from '@/lib/utils';
import { type LucideIcon, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

function EmptyState({ icon: Icon = Inbox, title, description, actionLabel, onAction, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 text-center', className)}>
      <div className="rounded-full bg-[var(--bg-tertiary)] p-4">
        <Icon className="h-8 w-8 text-[var(--fg-muted)]" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-[var(--fg)]">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-[var(--fg-secondary)]">{description}</p>}
      {actionLabel && onAction && (
        <Button onClick={onAction} className="mt-4" size="sm">{actionLabel}</Button>
      )}
    </div>
  );
}

export { EmptyState };
