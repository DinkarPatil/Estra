'use client';
import { cn } from '@/lib/utils';

interface AnimatedContainerProps {
  delay?: number;
  className?: string;
  children: React.ReactNode;
}

function AnimatedContainer({ delay = 0, className, children }: AnimatedContainerProps) {
  return (
    <div
      className={cn('animate-in fade-in slide-in-from-bottom-2', className)}
      style={{
        animationDelay: `${delay}ms`,
        animationDuration: '0.4s',
        animationFillMode: 'both',
      }}
    >
      {children}
    </div>
  );
}

export { AnimatedContainer };
