'use client';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Clock, Construction, HardHat } from 'lucide-react';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import { AIChatWidget } from '@/components/shared/ai-chat-widget';
import { NegotiationNotifications } from '@/components/shared/negotiation-notifications';
import { NegotiationBellBridge } from '@/components/shared/negotiation-bell-bridge';
import { useAuth } from '@/contexts/auth-context';
import { LeadPipelineProvider } from '@/contexts/lead-pipeline-context';
import { sectionsByRole } from '@/lib/navigation';

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Honour the user's stored theme preference; default to dark when no
  // preference is saved. Earlier this mounted forced dark — that
  // prevented the light theme from ever rendering on dashboard routes.
  useEffect(() => {
    const html = document.documentElement;
    const stored = (() => {
      try { return localStorage.getItem('glimmora-theme'); } catch { return null; }
    })();
    const shouldBeDark = stored ? stored === 'dark' : true;
    html.classList.toggle('dark', shouldBeDark);
  }, []);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !user)) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--bg)]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#1F2937] border-t-[#8B7355]" />
          <p className="text-sm text-[var(--fg-muted)]">Analyzing global property intelligence...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const sections = sectionsByRole[user.role] || [];
  const isMvpRole = user.role === 'investor' || user.role === 'broker';

  // ── Descoped route check — show Coming Soon for non-MVP routes ──
  const investorMvpPrefixes = ['/investor', '/investor/areas', '/investor/properties', '/investor/compare', '/investor/ai-qa', '/investor/decision', '/investor/portfolio', '/investor/ai-deals', '/investor/negotiations'];
  const brokerMvpPrefixes = ['/broker', '/broker/leads', '/broker/listings', '/broker/negotiations', '/broker/analytics', '/broker/deals'];

  const isDescopedRoute =
    (user.role === 'investor' && !investorMvpPrefixes.some(p => pathname === p || pathname.startsWith(p + '/')) && pathname.startsWith('/investor')) ||
    (user.role === 'broker' && !brokerMvpPrefixes.some(p => pathname === p || pathname.startsWith(p + '/')) && pathname.startsWith('/broker'));

  // Non-MVP roles see a Coming Soon overlay (files kept, navigation hidden)
  if (!isMvpRole) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--bg)]">
        <div className="flex flex-col items-center gap-4 text-center max-w-md px-6">
          <div className="rounded-full bg-stone-800/50 p-4">
            <HardHat className="h-8 w-8 text-amber-400" strokeWidth={1.5} />
          </div>
          <h1 className="text-xl font-semibold text-white/80" style={{ fontFamily: 'var(--font-serif)' }}>
            {user.role === 'developer' ? 'Developer Portal' : 'Admin Console'}
          </h1>
          <p className="text-sm text-white/35 leading-relaxed">
            This profile is under development and will be available in a future release.
          </p>
          <div className="flex items-center gap-2 text-xs text-amber-400/70 mt-2">
            <Clock className="h-3.5 w-3.5" />
            <span>Coming soon</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <LeadPipelineProvider>
      <div className="flex h-screen overflow-hidden bg-[var(--bg)]">
        <Sidebar
          sections={sections}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          userName={user.name}
          userRole={user.role}
          userEmail={user.email}
        />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Topbar onMenuClick={() => setSidebarCollapsed(!sidebarCollapsed)} />
          <main className="platform-bg relative flex-1 overflow-y-auto overflow-x-hidden">
            <div className="relative z-10 min-w-0 w-full pt-6">
              {isDescopedRoute ? (
                <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
                  <div className="rounded-full bg-stone-800/40 p-4 mb-5">
                    <Construction className="h-8 w-8 text-amber-400/70" strokeWidth={1.5} />
                  </div>
                  <h2 className="text-xl font-semibold text-white/70 mb-2" style={{ fontFamily: 'var(--font-serif)' }}>
                    Coming Soon
                  </h2>
                  <p className="text-sm text-white/30 max-w-md leading-relaxed">
                    This feature is under development and will be available in a future release.
                  </p>
                  <div className="flex items-center gap-2 mt-5 text-xs text-amber-400/50">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Under development</span>
                  </div>
                </div>
              ) : (
                children
              )}
            </div>
          </main>
        </div>
        {/* AI Chat Assistant — floating widget */}
        {user.role === 'investor' && <AIChatWidget />}
        {/* Negotiation notifications — bottom-center toasts for broker messages & acceptance */}
        {user.role === 'investor' && <NegotiationNotifications />}
        {/* Bell notification bridge — injects into the topbar bell for both roles */}
        {isMvpRole && <NegotiationBellBridge />}
      </div>
    </LeadPipelineProvider>
  );
}
