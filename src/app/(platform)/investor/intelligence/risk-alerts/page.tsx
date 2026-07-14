'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Bell, AlertTriangle, TrendingDown, Shield, MapPin,
  Clock, ChevronRight, Eye, Check, Filter,
  Building2, Globe, BarChart3, Zap,
} from 'lucide-react';

/* ─── Mock Investor Risk Alerts ─── */

interface RiskAlert {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  category: string;
  affectedAssets: string[];
  timestamp: string;
  action: string;
  isRead: boolean;
  metric?: { label: string; value: string; delta: string; direction: 'up' | 'down' };
}

const MOCK_ALERTS: RiskAlert[] = [
  {
    id: '1',
    severity: 'critical',
    title: 'Market Downturn Detected — Dubai Marina',
    description: 'Property values in Dubai Marina have declined 4.2% in the last 30 days, triggered by regulatory changes affecting foreign ownership. AI models predict a further 2-3% correction over the next quarter.',
    category: 'Market Risk',
    affectedAssets: ['Marina Bay Penthouse', 'Dubai Creek Tower'],
    timestamp: '2 hours ago',
    action: 'Review exposure and consider hedging positions',
    isRead: false,
    metric: { label: 'Value Change', value: '-4.2%', delta: '-₹210K', direction: 'down' },
  },
  {
    id: '2',
    severity: 'high',
    title: 'Tenant Default Risk — Palm Jumeirah Villa',
    description: 'Credit monitoring indicates your primary tenant has received a credit downgrade. Payment history shows 2 late payments in the last 3 months. Recommended to review lease terms.',
    category: 'Tenant Risk',
    affectedAssets: ['Palm Jumeirah Villa'],
    timestamp: '6 hours ago',
    action: 'Contact property manager for tenant assessment',
    isRead: false,
    metric: { label: 'Payment Score', value: '62/100', delta: '-18pts', direction: 'down' },
  },
  {
    id: '3',
    severity: 'medium',
    title: 'Interest Rate Hike — Variable Loans',
    description: 'Central bank has signaled a 0.25% rate increase effective next month. This will increase your monthly mortgage payments by approximately ₹340 across 2 variable-rate loans.',
    category: 'Financial Risk',
    affectedAssets: ['Singapore Condo', 'London Flat'],
    timestamp: '1 day ago',
    action: 'Consider refinancing to fixed-rate loans',
    isRead: true,
    metric: { label: 'Monthly Impact', value: '+₹340', delta: '+2.1%', direction: 'up' },
  },
  {
    id: '4',
    severity: 'medium',
    title: 'Concentration Risk — Over-Exposed to Residential',
    description: 'Your portfolio has 78% allocation to residential properties, exceeding the recommended 60% threshold. Diversifying into commercial or mixed-use would reduce risk.',
    category: 'Portfolio Risk',
    affectedAssets: ['All Residential'],
    timestamp: '2 days ago',
    action: 'Explore commercial property opportunities',
    isRead: true,
  },
  {
    id: '5',
    severity: 'low',
    title: 'Maintenance Due — Annual Inspection',
    description: 'Three properties are due for annual building inspection next month. Scheduling proactively can reduce costs by 15% compared to reactive maintenance.',
    category: 'Operational',
    affectedAssets: ['Marina Bay Penthouse', 'Palm Jumeirah Villa', 'Singapore Condo'],
    timestamp: '3 days ago',
    action: 'Schedule inspections with property manager',
    isRead: true,
  },
  {
    id: '6',
    severity: 'low',
    title: 'Positive Signal — New Metro Station Approved',
    description: 'Government has approved construction of a new metro station 1.2km from your Singapore property. Historical data shows 12-18% property value increase within 2 years of station completion.',
    category: 'Opportunity',
    affectedAssets: ['Singapore Condo'],
    timestamp: '4 days ago',
    action: 'Hold position — appreciation expected',
    isRead: true,
    metric: { label: 'Expected Uplift', value: '+15%', delta: '+₹120K', direction: 'up' },
  },
];

const SEVERITY_CONFIG = {
  critical: { color: '#EF4444', bg: 'rgba(239,68,68,0.08)', label: 'Critical', icon: AlertTriangle },
  high: { color: '#F59E0B', bg: 'rgba(245,158,11,0.08)', label: 'High', icon: Zap },
  medium: { color: '#8B7355', bg: 'rgba(139,115,85,0.08)', label: 'Medium', icon: Shield },
  low: { color: '#22C55E', bg: 'rgba(34,197,94,0.08)', label: 'Low', icon: Check },
};

const CATEGORY_ICONS: Record<string, typeof Building2> = {
  'Market Risk': Globe,
  'Tenant Risk': Building2,
  'Financial Risk': BarChart3,
  'Portfolio Risk': Shield,
  Operational: Clock,
  Opportunity: TrendingDown,
};

export default function RiskAlertsPage() {
  const [alerts, setAlerts] = useState(MOCK_ALERTS);
  const [filter, setFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const unreadCount = alerts.filter((a) => !a.isRead).length;
  const criticalCount = alerts.filter((a) => a.severity === 'critical').length;

  const filtered = alerts.filter((a) => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !a.isRead;
    return a.severity === filter;
  });

  const markRead = (id: string) => {
    setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, isRead: true } : a));
  };

  const markAllRead = () => {
    setAlerts((prev) => prev.map((a) => ({ ...a, isRead: true })));
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="ai-deal-hero">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#EF4444] to-[#F59E0B] flex items-center justify-center">
              <Bell className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[var(--fg)]">Risk Alerts</h1>
              <p className="text-xs text-[var(--fg-muted)]">Real-time monitoring across your portfolio</p>
            </div>
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="text-xs font-medium text-[#8B7355] hover:underline">
              Mark all as read ({unreadCount})
            </button>
          )}
        </div>

        {/* Summary cards */}
        <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
          {[
            { label: 'Total Alerts', value: alerts.length, color: '#8B7355' },
            { label: 'Critical', value: criticalCount, color: '#EF4444' },
            { label: 'Unread', value: unreadCount, color: '#F59E0B' },
            { label: 'Resolved (30d)', value: 14, color: '#22C55E' },
          ].map((s) => (
            <div key={s.label} className="risk-summary-card">
              <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[10px] uppercase tracking-wide text-[var(--fg-muted)] mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="h-3.5 w-3.5 text-[var(--fg-muted)]" />
        {['all', 'unread', 'critical', 'high', 'medium', 'low'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`ex-pill ${filter === f ? 'active' : ''}`}
          >
            {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            {f === 'unread' && unreadCount > 0 && (
              <span className="ml-1 w-4 h-4 rounded-full bg-[#EF4444] text-white text-[9px] font-bold flex items-center justify-center">{unreadCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Alert Timeline */}
      <div className="space-y-3">
        {filtered.map((alert, i) => {
          const cfg = SEVERITY_CONFIG[alert.severity];
          const CatIcon = CATEGORY_ICONS[alert.category] || Shield;
          const isExpanded = expandedId === alert.id;

          return (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <div
                className="risk-alert-card"
                style={{ '--risk-color': cfg.color } as React.CSSProperties}
                onClick={() => { setExpandedId(isExpanded ? null : alert.id); markRead(alert.id); }}
              >
                <div className="flex items-start gap-3 cursor-pointer">
                  <div className="h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: cfg.bg, color: cfg.color }}>
                    <cfg.icon className="h-4 w-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`risk-badge risk-badge-${alert.severity}`}>{cfg.label}</span>
                      <span className="text-[10px] text-[var(--fg-muted)] flex items-center gap-1">
                        <CatIcon className="h-3 w-3" /> {alert.category}
                      </span>
                      {!alert.isRead && <span className="w-2 h-2 rounded-full bg-[#8B7355]" />}
                    </div>
                    <h3 className={`text-sm font-semibold mt-1.5 ${alert.isRead ? 'text-[var(--fg-secondary)]' : 'text-[var(--fg)]'}`}>
                      {alert.title}
                    </h3>
                    <p className="text-xs text-[var(--fg-muted)] flex items-center gap-1 mt-1">
                      <Clock className="h-3 w-3" /> {alert.timestamp}
                    </p>
                  </div>

                  {alert.metric && (
                    <div className="text-right flex-shrink-0 hidden sm:block">
                      <p className={`text-base font-bold ${alert.metric.direction === 'down' ? 'text-[#EF4444]' : 'text-[#22C55E]'}`}>
                        {alert.metric.value}
                      </p>
                      <p className="text-[10px] text-[var(--fg-muted)]">{alert.metric.label}</p>
                    </div>
                  )}

                  <ChevronRight className={`h-4 w-4 text-[var(--fg-muted)] transition-transform flex-shrink-0 mt-2 ${isExpanded ? 'rotate-90' : ''}`} />
                </div>

                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="mt-4 pt-4 border-t border-[rgba(139,115,85,0.08)] space-y-3"
                  >
                    <p className="text-sm text-[var(--fg-secondary)] leading-relaxed">{alert.description}</p>

                    <div className="flex flex-wrap gap-1.5">
                      <span className="text-[10px] font-medium text-[var(--fg-muted)] uppercase tracking-wide mr-1">Affected:</span>
                      {alert.affectedAssets.map((a) => (
                        <span key={a} className="ai-deal-tag flex items-center gap-1">
                          <MapPin className="h-2.5 w-2.5" /> {a}
                        </span>
                      ))}
                    </div>

                    <div className="ai-deal-why">
                      <p className="text-xs font-semibold text-[var(--fg)] mb-1">Recommended Action</p>
                      <p>{alert.action}</p>
                    </div>

                    <div className="flex gap-2 mt-2">
                      <button className="ai-deal-cta text-xs">
                        <Eye className="h-3 w-3" /> View Details
                      </button>
                      <button className="text-xs font-medium text-[var(--fg-secondary)] px-3 py-1.5 rounded-lg border border-[rgba(139,115,85,0.12)] hover:bg-[rgba(139,115,85,0.04)]">
                        Dismiss
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <Shield className="h-12 w-12 text-[#22C55E] mx-auto mb-3" />
          <p className="text-sm font-medium text-[var(--fg)]">All clear!</p>
          <p className="text-xs text-[var(--fg-muted)] mt-1">No alerts match this filter.</p>
        </div>
      )}
    </div>
  );
}
