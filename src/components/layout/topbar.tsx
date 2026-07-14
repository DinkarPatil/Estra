'use client';
import { useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Bell, Search, Moon, Sun, Menu } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/contexts/theme-context';
import { useNotifications } from '@/contexts/notification-context';
import { useKeyboardShortcut } from '@/hooks/use-keyboard-shortcut';
import { Popover } from '@/components/ui/popover';
import { NotificationPanel } from '@/components/notifications/notification-panel';
import { ProfileDropdown } from '@/components/layout/profile-dropdown';
import { CommandPalette } from '@/components/search/command-palette';
import { AiAssistantPanel } from '@/components/ai/ai-assistant-panel';
import { TopbarBreadcrumb } from '@/components/layout/topbar-breadcrumb';

interface TopbarProps {
  onMenuClick: () => void;
  className?: string;
}

function Topbar({ onMenuClick, className }: TopbarProps) {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { unreadCount } = useNotifications();

  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);

  const bellRef = useRef<HTMLButtonElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Cmd+K / Ctrl+K to open search
  useKeyboardShortcut('k', () => setSearchOpen(true), { metaKey: true });

  return (
    <>
      <header
        className={cn(
          'topbar-glass sticky top-0 z-30 flex h-[var(--spacing-topbar)] shrink-0 items-center',
          className
        )}
      >
        <div className="mx-auto flex w-full max-w-[1280px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onMenuClick}
            className="topbar-icon rounded-lg p-1.5 lg:hidden cursor-pointer shrink-0"
          >
            <Menu className="h-5 w-5" />
          </button>
          <TopbarBreadcrumb />
        </div>

        <div className="flex items-center gap-1.5">
          {/* Search — shows ⌘K hint */}
          <button
            onClick={() => setSearchOpen(true)}
            className="topbar-icon rounded-lg p-2 cursor-pointer flex items-center gap-1.5"
          >
            <Search className="h-5 w-5" />
            <kbd className="hidden lg:flex h-5 items-center gap-0.5 rounded border border-[var(--border)] px-1.5 text-[10px] text-[var(--fg-muted)] font-mono">
              ⌘K
            </kbd>
          </button>

          {/* Notifications */}
          <Popover
            open={notifOpen}
            onOpenChange={setNotifOpen}
            align="end"
            sideOffset={8}
            trigger={
              <button
                ref={bellRef}
                className="topbar-icon relative rounded-lg p-2 cursor-pointer"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--accent)] px-1 text-[9px] font-bold text-white shadow-[0_0_8px_rgba(139,115,85,0.3)]">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            }
          >
            <NotificationPanel onClose={() => setNotifOpen(false)} />
          </Popover>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="topbar-icon rounded-lg p-2 cursor-pointer"
          >
            {theme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </button>

          {/* User menu */}
          {user && (
            <Popover
              open={profileOpen}
              onOpenChange={setProfileOpen}
              align="end"
              sideOffset={8}
              trigger={
                <div
                  ref={profileRef}
                  className="ml-2 flex items-center gap-3 border-l border-[var(--border)] pl-4 cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <div className="hidden sm:block text-right">
                    <p className="text-sm font-medium text-[var(--fg)]">{user.name}</p>
                    <p className="text-xs text-[var(--fg-muted)] capitalize">{user.role}</p>
                  </div>
                  <Avatar fallback={user.name} size="sm" />
                </div>
              }
            >
              <ProfileDropdown onClose={() => setProfileOpen(false)} />
            </Popover>
          )}
        </div>
        </div>
      </header>

      {/* Command Palette (Cmd+K) */}
      <CommandPalette
        open={searchOpen}
        onOpenChange={setSearchOpen}
        onToggleTheme={toggleTheme}
        onOpenNotifications={() => setNotifOpen(true)}
      />

      {/* AI Assistant Panel */}
      <AiAssistantPanel open={aiOpen} onClose={() => setAiOpen(false)} />
    </>
  );
}

export { Topbar };
