'use client';
import { useRouter } from 'next/navigation';
import { useNotifications } from '@/contexts/notification-context';
import { formatRelativeTime } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import {
  Brain, ArrowRightLeft, Building2, Settings, CheckCheck, X, Bell,
} from 'lucide-react';
import type { AppNotification } from '@/mock-data/notifications';

const TYPE_ICONS: Record<AppNotification['type'], typeof Brain> = {
  'ai-insight': Brain,
  'property-update': Building2,
  'transaction': ArrowRightLeft,
  'system': Settings,
};

const TYPE_COLORS: Record<AppNotification['type'], string> = {
  'ai-insight': '#8B7355',
  'property-update': '#8B7355',
  'transaction': '#4ADE80',
  'system': '#6B7280',
};

export function NotificationPanel({ onClose }: { onClose: () => void }) {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, clearAll } = useNotifications();
  const router = useRouter();

  function handleClick(n: AppNotification) {
    markAsRead(n.id);
    if (n.actionUrl) {
      router.push(n.actionUrl);
      onClose();
    }
  }

  function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    deleteNotification(id);
  }

  return (
    <div className="w-[380px] max-h-[480px] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-[var(--border)]">
        <div>
          <h3 className="text-[14px] font-semibold text-[var(--fg)]">Notifications</h3>
          {unreadCount > 0 && (
            <p className="text-[11px] text-[var(--fg-muted)] mt-0.5">{unreadCount} unread</p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-1.5 text-[11px] text-[#8B7355] hover:opacity-80 transition-all font-medium cursor-pointer"
          >
            <CheckCheck className="h-3.5 w-3.5" strokeWidth={1.5} />
            Mark all read
          </button>
        )}
      </div>

      {/* Notifications list */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--bg-secondary)] mb-3">
              <Bell className="h-6 w-6 text-[var(--fg-muted)] opacity-40" />
            </div>
            <p className="text-sm font-medium text-[var(--fg-secondary)]">All caught up</p>
            <p className="text-xs text-[var(--fg-muted)] mt-1">No notifications to show</p>
          </div>
        ) : (
          notifications.map((n) => {
            const Icon = TYPE_ICONS[n.type];
            const color = TYPE_COLORS[n.type];
            return (
              <div
                key={n.id}
                className={cn(
                  'w-full flex items-start gap-3 px-4 py-3 border-b border-[var(--border)] text-left transition-colors duration-150 group relative',
                  n.read
                    ? 'hover:bg-[var(--bg-secondary)]'
                    : 'bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)]'
                )}
              >
                <button
                  onClick={() => handleClick(n)}
                  className="flex items-start gap-3 flex-1 min-w-0 cursor-pointer"
                >
                  <div
                    className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: `${color}12`, border: `1px solid ${color}18` }}
                  >
                    <Icon className="h-4 w-4" style={{ color }} strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2">
                      <p className={cn(
                        'text-[12px] leading-[1.4] truncate flex-1',
                        n.read ? 'text-[var(--fg-secondary)] font-medium' : 'text-[var(--fg)] font-semibold'
                      )}>
                        {n.title}
                      </p>
                      {!n.read && (
                        <span className="h-2 w-2 rounded-full bg-[#8B7355] shrink-0 mt-1" />
                      )}
                    </div>
                    <p className="text-[11px] text-[var(--fg-muted)] leading-[1.5] line-clamp-2 mt-0.5">
                      {n.message}
                    </p>
                    <p className="text-[10px] text-[var(--fg-muted)] opacity-60 mt-1">
                      {formatRelativeTime(n.timestamp)}
                    </p>
                  </div>
                </button>
                {/* Delete button */}
                <button
                  onClick={(e) => handleDelete(e, n.id)}
                  className="absolute right-3 top-3 rounded-md p-1 text-[var(--fg-muted)] hover:text-[#EF4444] hover:bg-[rgba(239,68,68,0.06)] opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                  title="Delete notification"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="px-4 py-3 border-t border-[var(--border)]">
          <button
            onClick={clearAll}
            className="w-full text-center text-[11px] text-[#EF4444] hover:text-[#DC2626] transition-colors font-medium cursor-pointer"
          >
            Clear All Notifications
          </button>
        </div>
      )}
    </div>
  );
}
