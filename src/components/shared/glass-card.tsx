'use client';
import { cn } from '@/lib/utils';

interface GlassCardProps {
  variant?: 'default' | 'elevated' | 'accent';
  glowColor?: string;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}

function GlassCard({ variant = 'default', glowColor, className, children, onClick }: GlassCardProps) {
  const base = 'relative rounded-2xl transition-all duration-300';

  const variants = {
    default: 'bg-white/80 dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06] backdrop-blur-xl shadow-sm',
    elevated: 'bg-white/90 dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/[0.08] backdrop-blur-xl shadow-md hover:shadow-lg dark:shadow-black/20',
    accent: 'bg-gradient-to-br from-[rgba(139,115,85,0.06)] to-[rgba(198,168,107,0.03)] dark:from-[rgba(139,115,85,0.08)] dark:to-[rgba(198,168,107,0.04)] border border-[rgba(139,115,85,0.12)] dark:border-[rgba(139,115,85,0.15)] backdrop-blur-xl',
  };

  return (
    <div
      className={cn(base, variants[variant], onClick && 'cursor-pointer', className)}
      onClick={onClick}
      style={glowColor ? { boxShadow: `0 0 30px ${glowColor}` } : undefined}
    >
      {children}
    </div>
  );
}

export { GlassCard };
