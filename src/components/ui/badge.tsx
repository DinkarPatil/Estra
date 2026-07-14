import * as React from 'react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium tracking-wide transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-[rgba(139,115,85,0.08)] text-[#8B7355] border border-[rgba(139,115,85,0.12)]',
        success: 'bg-[rgba(16,185,129,0.08)] text-[#10B981] border border-[rgba(16,185,129,0.12)]',
        warning: 'bg-[rgba(245,158,11,0.08)] text-[#F59E0B] border border-[rgba(245,158,11,0.12)]',
        danger: 'bg-[rgba(239,68,68,0.08)] text-[#EF4444] border border-[rgba(239,68,68,0.12)]',
        info: 'bg-[rgba(139,115,85,0.08)] text-[#8B7355] border border-[rgba(139,115,85,0.12)]',
        outline: 'border border-[var(--border)] text-[var(--fg-secondary)]',
        secondary: 'bg-[var(--bg-secondary)] text-[var(--fg-secondary)] border border-[var(--border-light)]',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
