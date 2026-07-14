'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import { useAuth } from '@/contexts/auth-context';
import { useKeyboardShortcut } from '@/hooks/use-keyboard-shortcut';
import { navigationByRole } from '@/lib/navigation';
import { useProperties } from '@/hooks/use-properties';
import {
  Search, Building2, FileText, Zap, MapPin,
  Sun, Moon, Bell,
} from 'lucide-react';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onToggleTheme?: () => void;
  onOpenNotifications?: () => void;
}

export function CommandPalette({
  open,
  onOpenChange,
  onToggleTheme,
  onOpenNotifications,
}: CommandPaletteProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const { properties } = useProperties({ limit: 6 });

  // Close on Escape
  useKeyboardShortcut('Escape', () => onOpenChange(false), { enabled: open });

  // Reset query on open
  useEffect(() => {
    if (open) setQuery('');
  }, [open]);

  if (!open) return null;

  const navItems = user ? (navigationByRole[user.role] || []) : [];

  function go(path: string) {
    router.push(path);
    onOpenChange(false);
  }

  function action(fn?: () => void) {
    fn?.();
    onOpenChange(false);
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />

      {/* Command palette */}
      <div className="relative z-10 w-full max-w-2xl animate-scale-in">
        <Command
          className="cmd-root popover-panel overflow-hidden"
          shouldFilter={true}
        >
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 border-b border-[var(--border)]">
            <Search className="h-5 w-5 text-[var(--fg-muted)] shrink-0" strokeWidth={1.5} />
            <Command.Input
              value={query}
              onValueChange={setQuery}
              placeholder="Search properties, pages, actions..."
              className="flex-1 h-12 bg-transparent text-[14px] text-[var(--fg)] placeholder:text-[var(--fg-muted)] focus:outline-none"
            />
            <kbd className="shrink-0 h-6 px-1.5 rounded border border-[var(--border)] text-[10px] text-[var(--fg-muted)] flex items-center font-mono">
              ESC
            </kbd>
          </div>

          <Command.List className="max-h-[360px] overflow-y-auto scrollbar-thin p-2">
            <Command.Empty className="py-8 text-center text-[13px] text-[var(--fg-muted)]">
              No results found.
            </Command.Empty>

            {/* Properties */}
            <Command.Group heading="Properties" className="cmd-group">
              {properties.map((prop) => (
                <Command.Item
                  key={prop.id}
                  value={`${prop.title} ${prop.location.city} ${prop.location.country}`}
                  onSelect={() => go(`/investor/properties/${prop.id}`)}
                  className="cmd-item"
                >
                  <Building2 className="h-4 w-4 text-[var(--gold)] shrink-0" strokeWidth={1.5} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] truncate">{prop.title}</p>
                    <p className="text-[11px] text-[var(--fg-muted)] flex items-center gap-1">
                      <MapPin className="h-3 w-3" strokeWidth={1.5} />
                      {prop.location.city}, {prop.location.country}
                    </p>
                  </div>
                </Command.Item>
              ))}
            </Command.Group>

            {/* Pages */}
            <Command.Group heading="Pages" className="cmd-group">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Command.Item
                    key={item.href}
                    value={item.title}
                    onSelect={() => go(item.href)}
                    className="cmd-item"
                  >
                    <Icon className="h-4 w-4 text-[var(--gold)] shrink-0" strokeWidth={1.5} />
                    <span className="text-[13px]">{item.title}</span>
                  </Command.Item>
                );
              })}
            </Command.Group>

            {/* Quick Actions */}
            <Command.Group heading="Quick Actions" className="cmd-group">
              <Command.Item
                value="Toggle dark light theme"
                onSelect={() => action(onToggleTheme)}
                className="cmd-item"
              >
                <Sun className="h-4 w-4 text-[#F59E0B] shrink-0" strokeWidth={1.5} />
                <span className="text-[13px]">Toggle Theme</span>
              </Command.Item>
              <Command.Item
                value="Open notifications alerts"
                onSelect={() => action(onOpenNotifications)}
                className="cmd-item"
              >
                <Bell className="h-4 w-4 text-[var(--gold)] shrink-0" strokeWidth={1.5} />
                <span className="text-[13px]">Open Notifications</span>
              </Command.Item>
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
