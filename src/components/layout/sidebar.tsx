'use client';
import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronLeft, LogOut, Menu, Settings, Sparkles } from 'lucide-react';
import type { NavItem, NavSection } from '@/lib/navigation';
import { useAuth } from '@/contexts/auth-context';

/* ─── Types ─── */

interface SidebarProps {
  sections: NavSection[];
  collapsed: boolean;
  onToggle: () => void;
  userName: string;
  userRole: string;
  userEmail: string;
}

/* ─── Tier labels for investor display ─── */

const TIER_LABELS: Record<string, string> = {
  uhni: 'UHNI',
  hni: 'HNI',
  standard: 'Standard',
};

const ROLE_LABELS: Record<string, string> = {
  investor: 'Investor',
  broker: 'Broker',
  developer: 'Developer',
  admin: 'Administrator',
};

/* ─── Main Component ─── */

function Sidebar({ sections, collapsed, onToggle, userName, userRole, userEmail }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  // Accordion: only one expandable group open at a time
  const [expandedKey, setExpandedKey] = React.useState<string | null>(null);

  // Auto-expand the group whose child matches the current route on mount/navigation
  React.useEffect(() => {
    for (const section of sections) {
      for (const item of section.items) {
        if (item.children?.some((child) => pathname === child.href || pathname.startsWith(child.href + '/'))) {
          setExpandedKey(item.href);
          return;
        }
      }
    }
  }, [pathname, sections]);

  const toggleExpand = React.useCallback((key: string) => {
    setExpandedKey((prev) => (prev === key ? null : key));
  }, []);

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden transition-opacity duration-300',
          collapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'
        )}
        onClick={onToggle}
      />

      <aside
        className={cn(
          'sb-shell fixed top-0 left-0 z-50 flex h-full flex-col justify-between transition-all duration-300 lg:relative lg:z-auto overflow-hidden',
          collapsed
            ? '-translate-x-full lg:translate-x-0 lg:w-[var(--spacing-sidebar-collapsed)]'
            : 'w-[var(--spacing-sidebar)]'
        )}
      >
        {/* Ambient glow effects */}
        <div className="sb-glow-top" />
        <div className="sb-glow-edge" />

        {/* ── Logo ── */}
        <div className="sb-logo-area flex h-[var(--spacing-topbar)] shrink-0 items-center justify-between px-4">
          {!collapsed && (
            <Link href="/" className="flex items-center group" aria-label="Estra Glimmora — Home">
              <img
                src="/EstraGlimmora_logo.png"
                alt="Estra Glimmora"
                className="h-9 w-auto object-contain max-w-[160px] sm:max-w-[180px] lg:max-w-[200px]"
                draggable={false}
              />
            </Link>
          )}
          <button onClick={onToggle} className="sb-toggle rounded-lg p-2" aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
            {collapsed ? <Menu className="h-[18px] w-[18px]" /> : <ChevronLeft className="h-[18px] w-[18px]" />}
          </button>
        </div>

        {/* ── Sectioned Navigation ── */}
        <nav className="sb-nav min-h-0 flex-1 overflow-y-auto px-3 pt-5 pb-4 scrollbar-thin">
          {collapsed ? (
            /* Collapsed: flat icon list */
            <ul className="space-y-1">
              {sections.flatMap((s) => s.items).map((item) => (
                <SidebarItem
                  key={item.href}
                  item={item}
                  pathname={pathname}
                  collapsed
                  isExpanded={false}
                  onToggleExpand={() => {}}
                />
              ))}
            </ul>
          ) : (
            /* Expanded: grouped sections */
            sections.map((section, i) => {
              const isComingSoon = /coming soon/i.test(section.label);
              return (
                <div key={section.label} className={cn(i > 0 && 'mt-9')}>
                  <div className={cn('sb-section-label', isComingSoon && 'is-soon')}>
                    {section.label}
                  </div>
                  <ul className="space-y-1.5">
                    {section.items.map((item) => (
                      <SidebarItem
                        key={item.href}
                        item={item}
                        pathname={pathname}
                        collapsed={false}
                        isExpanded={expandedKey === item.href}
                        onToggleExpand={() => toggleExpand(item.href)}
                      />
                    ))}
                  </ul>
                </div>
              );
            })
          )}
        </nav>

        {/* ── Profile Card (bottom) ── */}
        {!collapsed && (
          <div className="sb-profile-area shrink-0 px-3 pb-4 pt-4">
            <div className="sb-profile-card group" tabIndex={0}>
              <div className="flex items-center gap-3 min-w-0">
                <div className="sb-avatar shrink-0">
                  <span>{userName.charAt(0)}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="sb-profile-name text-[13px] font-semibold leading-tight truncate">
                    {userName}
                  </p>
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="sb-profile-status inline-flex items-center gap-1 text-[10px] font-medium">
                      <span className="sb-online-dot" />
                      Online
                    </span>
                    <span className="sb-profile-sep">·</span>
                    <span className="sb-profile-meta text-[10px] truncate">
                      {user?.tier ? TIER_LABELS[user.tier] + ' ' : ''}{ROLE_LABELS[userRole] || userRole}
                    </span>
                  </div>
                </div>
              </div>

              {/* Hover-reveal actions — minimal text buttons */}
              <div className="sb-profile-actions flex">
                <Link href={`/${userRole}/settings`} className="sb-profile-action" title="Settings">
                  <Settings className="h-3.5 w-3.5" strokeWidth={1.8} />
                  <span>Settings</span>
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="sb-profile-action danger"
                  title="Sign out"
                >
                  <LogOut className="h-3.5 w-3.5" strokeWidth={1.8} />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}

/* ─── Nav Item ─── */

function SidebarItem({
  item,
  pathname,
  collapsed,
  isExpanded,
  onToggleExpand,
}: {
  item: NavItem;
  pathname: string;
  collapsed: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
}) {
  const isActive = pathname === item.href ||
    (item.href.split('/').length > 2 && pathname.startsWith(item.href + '/'));
  const Icon = item.icon;
  const isDisabled = item.badge === 'Soon';
  const isFeatured = !!item.featured;

  /* ── Disabled (Coming Soon) ── */
  if (isDisabled) {
    return (
      <li>
        <div
          className={cn(
            'sb-item sb-item-disabled flex items-center gap-2.5 rounded-xl px-3 py-[11px] text-[13px] font-medium select-none',
            collapsed && 'justify-center px-2'
          )}
          aria-disabled="true"
          title={collapsed ? `${item.title} — coming soon` : undefined}
        >
          <span className={cn('sb-icon-wrap', collapsed && 'mx-0')}>
            <Icon className="h-[18px] w-[18px]" strokeWidth={1.7} />
          </span>
          {!collapsed && (
            <span className="flex-1 truncate">{item.title}</span>
          )}
        </div>
      </li>
    );
  }

  /* ── Featured CTA (Smart Search) ── */
  if (isFeatured && !collapsed) {
    return (
      <li>
        <Link
          href={item.href}
          className={cn(
            'sb-item sb-item-featured group relative flex items-center gap-2.5 rounded-xl px-3 py-[12px] text-[13px] font-semibold',
            isActive && 'is-active'
          )}
        >
          <span className="sb-featured-icon">
            <Icon className="h-[18px] w-[18px]" strokeWidth={1.9} />
          </span>
          <span className="flex-1 leading-tight">{item.title}</span>
          <span className="sb-badge is-ai sb-badge-featured">
            <Sparkles className="h-[9px] w-[9px]" strokeWidth={2.4} />
            AI
          </span>
        </Link>
      </li>
    );
  }

  if (isFeatured && collapsed) {
    return (
      <li>
        <Link
          href={item.href}
          className={cn(
            'sb-item sb-item-featured group flex items-center justify-center rounded-xl px-2 py-[12px]',
            isActive && 'is-active'
          )}
          title={item.title}
        >
          <span className="sb-featured-icon">
            <Icon className="h-[18px] w-[18px]" strokeWidth={1.9} />
          </span>
        </Link>
      </li>
    );
  }

  /* ── Expandable parent ── */
  if (item.children && !collapsed) {
    const hasActiveChild = item.children.some(
      (child) => pathname === child.href || pathname.startsWith(child.href + '/')
    );

    return (
      <li>
        <button
          onClick={onToggleExpand}
          className={cn(
            'sb-item group flex w-full items-center gap-2.5 rounded-xl px-3 py-[11px] text-[13px] font-medium',
            hasActiveChild || isActive ? 'sb-item-active' : 'sb-item-idle'
          )}
        >
          <span className="sb-icon-wrap">
            <Icon className={cn('h-[18px] w-[18px]', (hasActiveChild || isActive) && 'sb-icon-lit')} strokeWidth={1.7} />
          </span>
          <span className="flex-1 text-left">{item.title}</span>
          {item.badge && (
            <span className={cn('sb-badge', item.badge === 'AI' && 'is-ai')}>
              {item.badge}
            </span>
          )}
          <ChevronDown
            className={cn(
              'h-3.5 w-3.5 transition-transform duration-200',
              isExpanded && 'rotate-180',
              (hasActiveChild || isActive) ? 'text-white/40' : 'text-white/25'
            )}
          />
        </button>
        <div
          className={cn(
            'sb-children-wrap overflow-hidden transition-all duration-250',
            isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
          )}
        >
          <ul className="sb-children mt-1 space-y-0.5 ml-[22px] pl-4">
            {item.children.map((child) => {
              const ChildIcon = child.icon;
              const childActive = pathname === child.href;
              return (
                <li key={child.href}>
                  <Link
                    href={child.href}
                    className={cn(
                      'sb-child flex items-center gap-2.5 rounded-lg px-3 py-[7px] text-[12.5px] transition-all duration-200',
                      childActive ? 'sb-child-active' : 'sb-child-idle'
                    )}
                  >
                    <span className={cn('sb-child-icon-wrap', childActive && 'sb-child-icon-lit')}>
                      <ChildIcon className="h-[14px] w-[14px]" strokeWidth={1.7} />
                    </span>
                    {child.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </li>
    );
  }

  /* ── Standard link ── */
  return (
    <li>
      <Link
        href={item.href}
        className={cn(
          'sb-item group flex items-center gap-2.5 rounded-xl px-3 py-[11px] text-[13px] font-medium',
          isActive ? 'sb-item-active' : 'sb-item-idle',
          collapsed && 'justify-center px-2'
        )}
        title={collapsed ? item.title : undefined}
      >
        <span className={cn('sb-icon-wrap', collapsed && 'mx-0')}>
          <Icon className={cn('h-[18px] w-[18px]', isActive && 'sb-icon-lit')} strokeWidth={1.7} />
        </span>
        {!collapsed && (
          <>
            <span className="flex-1">{item.title}</span>
            {item.badge && (
              <span className={cn('sb-badge', item.badge === 'AI' && 'is-ai')}>
                {item.badge}
              </span>
            )}
          </>
        )}
      </Link>
    </li>
  );
}

export { Sidebar };
