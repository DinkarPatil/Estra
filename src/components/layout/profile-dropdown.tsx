'use client';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { User, Settings, HelpCircle, LogOut } from 'lucide-react';

export function ProfileDropdown({ onClose }: { onClose: () => void }) {
  const { user, logout } = useAuth();
  const router = useRouter();

  function navigate(path: string) {
    router.push(path);
    onClose();
  }

  return (
    <div className="w-[220px] py-2">
      {/* User header */}
      {user && (
        <div className="px-3 py-2.5 border-b border-[var(--border)] mb-1">
          <p className="text-[13px] font-semibold text-[var(--fg)] truncate">{user.name}</p>
          <p className="text-[11px] text-[var(--fg-muted)] truncate">{user.email}</p>
        </div>
      )}

      {/* Menu items */}
      <button
        onClick={() => navigate(`/${user?.role || 'investor'}/settings`)}
        className="flex w-full items-center gap-3 px-3 py-2 text-[13px] text-[var(--fg-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--fg)] transition-colors rounded-lg mx-0 cursor-pointer"
      >
        <User className="h-4 w-4" strokeWidth={1.5} />
        Profile
      </button>
      <button
        onClick={() => navigate(`/${user?.role || 'investor'}/settings`)}
        className="flex w-full items-center gap-3 px-3 py-2 text-[13px] text-[var(--fg-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--fg)] transition-colors rounded-lg cursor-pointer"
      >
        <Settings className="h-4 w-4" strokeWidth={1.5} />
        Settings
      </button>
      <button
        onClick={onClose}
        className="flex w-full items-center gap-3 px-3 py-2 text-[13px] text-[var(--fg-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--fg)] transition-colors rounded-lg cursor-pointer"
      >
        <HelpCircle className="h-4 w-4" strokeWidth={1.5} />
        Help Center
      </button>

      {/* Divider + Logout */}
      <div className="border-t border-[var(--border)] mt-1 pt-1">
        <button
          onClick={() => { logout(); onClose(); }}
          className="flex w-full items-center gap-3 px-3 py-2 text-[13px] text-[#EF4444]/80 hover:bg-[rgba(239,68,68,0.06)] hover:text-[#EF4444] transition-colors rounded-lg cursor-pointer"
        >
          <LogOut className="h-4 w-4" strokeWidth={1.5} />
          Logout
        </button>
      </div>
    </div>
  );
}
