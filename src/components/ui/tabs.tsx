'use client';
import * as React from 'react';
import { cn } from '@/lib/utils';

interface TabsProps {
  defaultValue: string;
  children: React.ReactNode;
  className?: string;
}

interface TabsContextType {
  activeTab: string;
  setActiveTab: (value: string) => void;
}

const TabsContext = React.createContext<TabsContextType | undefined>(undefined);

function Tabs({ defaultValue, children, className }: TabsProps) {
  const [activeTab, setActiveTab] = React.useState(defaultValue);
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={cn('w-full', className)}>{children}</div>
    </TabsContext.Provider>
  );
}

function TabsList({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('inline-flex items-center gap-1 rounded-lg bg-[var(--bg-tertiary)] p-1', className)}>
      {children}
    </div>
  );
}

function TabsTrigger({ value, children, className }: { value: string; children: React.ReactNode; className?: string }) {
  const context = React.useContext(TabsContext);
  if (!context) throw new Error('TabsTrigger must be used within Tabs');
  const isActive = context.activeTab === value;
  return (
    <button
      onClick={() => context.setActiveTab(value)}
      className={cn(
        'inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium transition-all',
        isActive
          ? 'bg-[var(--card-bg)] text-[var(--fg)] shadow-sm'
          : 'text-[var(--fg-secondary)] hover:text-[var(--fg)]',
        className
      )}
    >
      {children}
    </button>
  );
}

function TabsContent({ value, children, className }: { value: string; children: React.ReactNode; className?: string }) {
  const context = React.useContext(TabsContext);
  if (!context) throw new Error('TabsContent must be used within Tabs');
  if (context.activeTab !== value) return null;
  return <div className={cn('mt-4', className)}>{children}</div>;
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
