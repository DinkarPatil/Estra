'use client';
import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { mockNotifications, type AppNotification } from '@/mock-data/notifications';

export interface NotificationPreferences {
  email: boolean;
  sms: boolean;
  push: boolean;
  marketUpdates: boolean;
  dealAlerts: boolean;
}

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  addNotification: (notif: Omit<AppNotification, 'id' | 'read' | 'timestamp'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAll: () => void;
  preferences: NotificationPreferences;
  updatePreferences: (prefs: Partial<NotificationPreferences>) => void;
}

const PREFS_KEY = 'glimmora-notification-prefs';

const defaultPrefs: NotificationPreferences = {
  email: true,
  sms: true,
  push: false,
  marketUpdates: true,
  dealAlerts: true,
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>(mockNotifications);
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPrefs);

  // Load preferences from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(PREFS_KEY);
      if (stored) setPreferences(JSON.parse(stored));
    } catch {}
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const addNotification = useCallback((notif: Omit<AppNotification, 'id' | 'read' | 'timestamp'>) => {
    const newNotif: AppNotification = {
      ...notif,
      id: `neg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      read: false,
      timestamp: new Date().toISOString(),
    };
    setNotifications((prev) => [newNotif, ...prev]);
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const deleteNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const updatePreferences = useCallback((prefs: Partial<NotificationPreferences>) => {
    setPreferences((prev) => {
      const next = { ...prev, ...prefs };
      localStorage.setItem(PREFS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, addNotification, markAsRead, markAllAsRead, deleteNotification, clearAll, preferences, updatePreferences }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within NotificationProvider');
  return context;
}
