'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface DrawerTab {
  key: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface DrawerTabsProps {
  tabs: DrawerTab[];
  activeTab: string;
  onTabChange: (key: string) => void;
  layoutId?: string;
  className?: string;
}

export function DrawerTabs({ tabs, activeTab, onTabChange, layoutId = 'drawer-tab-underline', className }: DrawerTabsProps) {
  return (
    <div className={cn('flex border-b border-[var(--border)] px-5 gap-1 flex-shrink-0 overflow-x-auto scrollbar-none', className)}>
      {tabs.map(tab => {
        const isActive = activeTab === tab.key;
        const TabIcon = tab.icon;
        return (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-3 text-xs font-medium transition-all cursor-pointer relative whitespace-nowrap',
              isActive ? 'text-[#8B7355]' : 'text-[var(--fg-muted)] hover:text-[var(--fg)]',
            )}
          >
            {TabIcon && <TabIcon className="h-3 w-3" />}
            {tab.label}
            {isActive && (
              <motion.div
                layoutId={layoutId}
                className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#8B7355] rounded-full"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
