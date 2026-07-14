import { cn } from '@/lib/utils';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div className={cn('mx-auto w-full max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8', className)}>
      {children}
    </div>
  );
}

export { PageContainer };
