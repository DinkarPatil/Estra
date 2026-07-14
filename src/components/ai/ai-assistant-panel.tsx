'use client';

import {
  AlertTriangle,
  Sparkles, DollarSign, BarChart3, MessageSquare,
} from 'lucide-react';
import { AppDrawer, DrawerHeader, DrawerSection, DrawerFooter } from '@/components/ui/drawer';

interface AiAssistantPanelProps {
  open: boolean;
  onClose: () => void;
}

const predictions = [
  {
    region: 'Dubai Marina',
    signal: 'Strong Buy',
    confidence: 94,
    detail: '+14-18% projected growth in 12 months',
    color: '#4ADE80',
  },
  {
    region: 'Mumbai BKC',
    signal: 'Opportunity',
    confidence: 88,
    detail: 'Office yields hitting 7.8-8.5% with rising absorption',
    color: '#8B7355',
  },
  {
    region: 'London Prime',
    signal: 'Hold',
    confidence: 79,
    detail: 'Rate environment creating valuation pressure',
    color: '#F59E0B',
  },
];

const alerts = [
  'Palm Jumeirah rental demand up 22% MoM',
  'Singapore luxury segment cooling — monitor closely',
  'New RERA compliance rules effective Q2 2026',
  'AI model accuracy improved to 94.3% this quarter',
];

export function AiAssistantPanel({ open, onClose }: AiAssistantPanelProps) {
  return (
    <AppDrawer open={open} onClose={onClose} size="sm">
      <DrawerHeader
        title="AI Assistant"
        subtitle="Powered by Estra Glimmora Intelligence"
        logo={
          <img
            src="/EstraGlimmora_logo.png"
            alt="Estra Glimmora"
            className="h-8 w-auto object-contain max-w-[140px]"
            draggable={false}
          />
        }
        onClose={onClose}
      />

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-5 space-y-6">

        {/* Portfolio Summary */}
        <DrawerSection title="Portfolio Summary" icon={DollarSign} bare>
          <div className="grid grid-cols-3 gap-2.5">
            {[
              { label: 'Total Value', value: '$2.8M', color: 'var(--fg)' },
              { label: 'Monthly Income', value: '$11.8K', color: '#4ADE80' },
              { label: 'Active Assets', value: '3', color: '#8B7355' },
            ].map((s) => (
              <div key={s.label} className="rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] p-3">
                <p
                  className="text-[16px] font-semibold tracking-[-0.01em]"
                  style={{ fontFamily: 'var(--font-serif)', color: s.color }}
                >
                  {s.value}
                </p>
                <p className="text-[9px] uppercase tracking-[0.1em] text-[var(--fg-muted)] mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </DrawerSection>

        {/* AI Predictions */}
        <DrawerSection title="AI Predictions" icon={BarChart3} bare>
          <div className="space-y-2.5">
            {predictions.map((p) => (
              <div key={p.region} className="rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] p-3.5">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-[12px] font-semibold text-[var(--fg)]">{p.region}</h4>
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ color: p.color, background: `${p.color}12`, border: `1px solid ${p.color}20` }}
                  >
                    {p.signal}
                  </span>
                </div>
                <p className="text-[11px] text-[var(--fg-secondary)] mb-2">{p.detail}</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${p.confidence}%`, background: p.color }}
                    />
                  </div>
                  <span className="text-[10px] font-semibold" style={{ color: p.color }}>
                    {p.confidence}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </DrawerSection>

        {/* Market Alerts */}
        <DrawerSection title="Market Alerts" icon={AlertTriangle} bare>
          <div className="space-y-1.5">
            {alerts.map((alert, i) => (
              <div
                key={i}
                className="flex items-start gap-2.5 px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-[#F59E0B] shrink-0 mt-1.5" />
                <p className="text-[11px] text-[var(--fg-secondary)] leading-[1.5]">{alert}</p>
              </div>
            ))}
          </div>
        </DrawerSection>
      </div>

      {/* Footer input */}
      <DrawerFooter>
        <div className="flex items-center gap-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] px-3.5 py-2.5 w-full">
          <MessageSquare className="h-4 w-4 text-[var(--fg-muted)] shrink-0" strokeWidth={1.5} />
          <input
            type="text"
            placeholder="Ask AI anything..."
            className="flex-1 bg-transparent text-[13px] text-[var(--fg)] placeholder:text-[var(--fg-muted)] focus:outline-none"
          />
          <Sparkles className="h-4 w-4 text-[#8B7355] shrink-0" strokeWidth={1.5} />
        </div>
      </DrawerFooter>
    </AppDrawer>
  );
}
