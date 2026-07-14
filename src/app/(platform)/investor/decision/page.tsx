'use client';

/**
 * Decision Panel — the "decision moment" in the investor journey.
 *
 * Reads selected property IDs from the Investor Funnel context, picks a
 * winner using a weighted score, renders the winner as a hero, shows
 * dynamic reasoning, and wires Invest Now / Contact Broker into the
 * cross-role lead pipeline.
 */

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft, ArrowRight, Award, Brain, CheckCircle2, DollarSign,
  MapPin, MessageCircle, Phone, Send, Shield, Sparkles, Star, Target,
  TrendingUp, X,
} from 'lucide-react';

import { PageContainer } from '@/components/layout/page-container';
import { useAuth } from '@/contexts/auth-context';
import { useFunnel } from '@/contexts/investor-funnel-context';
import { useLeadPipeline } from '@/contexts/lead-pipeline-context';
import { mockProperties } from '@/mock-data/properties';
import { formatCurrency } from '@/lib/formatters';
import type { Property } from '@/types/property';
import type { LeadSource } from '@/types/lead';

/* ════════════════════════════════════════
   Winner scoring
   ═══════════════════════════════════════ */

const RISK_PENALTY: Record<Property['riskScore'], number> = {
  low: 0,
  medium: 4,
  high: 10,
  critical: 15,
};

/** Composite score: AI score weighted highest, then yield + appreciation, minus risk. */
function computeScore(p: Property): number {
  const ai = p.aiScore * 0.45;
  const yieldPts = p.rentalYield * 2.5;
  const apprecPts = p.capitalAppreciation * 1.6;
  const risk = RISK_PENALTY[p.riskScore];
  return Math.round(ai + yieldPts + apprecPts - risk);
}

function pickWinner(properties: Property[]): Property | null {
  if (properties.length === 0) return null;
  return [...properties].sort((a, b) => computeScore(b) - computeScore(a))[0];
}

/* ════════════════════════════════════════
   Reasoning generator — dynamic bullets
   ═══════════════════════════════════════ */

type Reason = { label: string; detail: string; icon: typeof Brain };

function generateReasoning(winner: Property, runnersUp: Property[]): Reason[] {
  const reasons: Reason[] = [];

  // 1. AI score
  const otherAvg =
    runnersUp.length > 0
      ? runnersUp.reduce((s, p) => s + p.aiScore, 0) / runnersUp.length
      : 0;
  if (winner.aiScore >= 85 || winner.aiScore > otherAvg + 3) {
    reasons.push({
      label: 'Top AI score',
      detail:
        runnersUp.length > 0
          ? `${winner.aiScore}/100 — ${(winner.aiScore - otherAvg).toFixed(0)} points above your other picks.`
          : `${winner.aiScore}/100 — a strong overall investment signal.`,
      icon: Brain,
    });
  }

  // 2. Yield
  const otherAvgYield =
    runnersUp.length > 0
      ? runnersUp.reduce((s, p) => s + p.rentalYield, 0) / runnersUp.length
      : 0;
  if (winner.rentalYield >= 5 || winner.rentalYield > otherAvgYield) {
    reasons.push({
      label: 'Leading rental yield',
      detail: `${winner.rentalYield}% — steady income${
        runnersUp.length > 0 && winner.rentalYield > otherAvgYield
          ? ` and ${(winner.rentalYield - otherAvgYield).toFixed(1)}% higher than your other shortlist.`
          : '.'
      }`,
      icon: DollarSign,
    });
  }

  // 3. Appreciation
  if (winner.capitalAppreciation >= 6) {
    reasons.push({
      label: 'Strong growth outlook',
      detail: `${winner.capitalAppreciation}% projected capital appreciation driven by area demand and developer track record.`,
      icon: TrendingUp,
    });
  }

  // 4. Risk
  if (winner.riskScore === 'low') {
    reasons.push({
      label: 'Low-risk profile',
      detail: 'Stable demand, pro-investment regulation, and tight supply signal low downside risk.',
      icon: Shield,
    });
  } else if (winner.riskScore === 'medium' && runnersUp.some((p) => p.riskScore === 'high')) {
    reasons.push({
      label: 'Better risk profile than shortlist',
      detail: `Medium risk rating beats the high-risk alternatives in your comparison.`,
      icon: Shield,
    });
  }

  // Always include at least one — fallback
  if (reasons.length === 0) {
    reasons.push({
      label: 'Balanced investment profile',
      detail: `${winner.aiScore}/100 AI score, ${winner.rentalYield}% yield, ${winner.capitalAppreciation}% appreciation.`,
      icon: Target,
    });
  }

  return reasons.slice(0, 4);
}

/* ════════════════════════════════════════
   Page
   ═══════════════════════════════════════ */

export default function DecisionPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { selectedPropertyIds, setCurrentStep, completeStep } = useFunnel();
  const { createLead } = useLeadPipeline();
  const [toast, setToast] = useState<{ title: string; body: string } | null>(null);

  // Mark step 5 (Decision) as active
  useEffect(() => {
    setCurrentStep(5);
    completeStep(4);
  }, [setCurrentStep, completeStep]);

  const selected = useMemo(
    () =>
      selectedPropertyIds
        .map((id) => mockProperties.find((p) => p.id === id))
        .filter((p): p is Property => Boolean(p)),
    [selectedPropertyIds],
  );

  const winner = useMemo(() => pickWinner(selected), [selected]);
  const runnersUp = useMemo(
    () => selected.filter((p) => winner && p.id !== winner.id),
    [selected, winner],
  );
  const reasoning = useMemo(
    () => (winner ? generateReasoning(winner, runnersUp) : []),
    [winner, runnersUp],
  );
  const winnerScore = winner ? computeScore(winner) : 0;

  const handleCreateLead = (source: Extract<LeadSource, 'invest-now' | 'contact-broker'>) => {
    if (!winner || !user) return;
    createLead({
      propertyId: winner.id,
      propertyName: winner.title,
      propertyLocation: `${winner.location.city}, ${winner.location.country}`,
      propertyPrice: winner.price,
      investorId: user.id,
      investorName: user.name,
      investorEmail: user.email,
      investorPhone: user.phone,
      intentLevel: source === 'invest-now' ? 'high' : 'medium',
      source,
    });
    completeStep(5);
    setToast(
      source === 'invest-now'
        ? {
            title: 'Lead created',
            body: `Your broker will reach out within 24 hours about ${winner.title}.`,
          }
        : {
            title: 'Broker contacted',
            body: `Your broker has been notified about ${winner.title} and will follow up.`,
          },
    );
    setTimeout(() => setToast(null), 4500);
  };

  /* ── Empty state (no selections) ── */
  if (selected.length === 0) {
    return (
      <PageContainer className="space-y-6">
        <Header />
        <div className="rounded-2xl border border-dashed border-stone-200 bg-white p-10 text-center shadow-[0_10px_30px_rgba(31,24,20,0.04)]">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-stone-50 text-stone-600">
            <Sparkles className="h-5 w-5" />
          </div>
          <h2 className="text-[15px] font-semibold text-stone-900 tracking-[-0.01em]">
            Nothing to decide on yet
          </h2>
          <p className="mx-auto mt-1 max-w-md text-[12.5px] text-stone-500 leading-relaxed">
            Shortlist at least one property from the Properties page. The more you
            compare, the sharper the decision signal.
          </p>
          <div className="mt-5 flex flex-col items-center justify-center gap-2 sm:flex-row">
            <Link
              href="/investor/properties"
              className="inline-flex items-center gap-1.5 rounded-lg bg-stone-600 px-4 py-2 text-[12.5px] font-semibold text-white transition-all duration-150 hover:-translate-y-0.5 hover:bg-stone-700 hover:shadow-[0_4px_14px_rgba(111,92,70,0.25)]"
            >
              Browse properties
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/investor/compare"
              className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-4 py-2 text-[12.5px] font-medium text-stone-700 transition-all duration-150 hover:border-stone-300 hover:bg-stone-50"
            >
              Open comparison
            </Link>
          </div>
        </div>
      </PageContainer>
    );
  }

  /* ── Main render ── */
  return (
    <PageContainer className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed right-4 top-20 z-50 w-[320px] max-w-[calc(100vw-32px)] overflow-hidden rounded-xl border border-emerald-200 bg-white shadow-[0_12px_32px_rgba(31,24,20,0.12)]">
          <div className="h-[3px] w-full bg-emerald-500" />
          <div className="flex items-start gap-3 p-4">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" strokeWidth={2.2} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-stone-900">{toast.title}</p>
              <p className="mt-0.5 text-[12px] leading-relaxed text-stone-600">{toast.body}</p>
            </div>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="rounded-md p-1 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      <Header />

      {winner && <WinnerCard property={winner} score={winnerScore} reasons={reasoning} />}

      {runnersUp.length > 0 && <RunnersUp properties={runnersUp} />}

      {/* Action section */}
      {winner && (
        <div
          className="relative overflow-hidden rounded-2xl border border-stone-100 p-6 sm:p-7"
          style={{
            background:
              'linear-gradient(135deg, #EDE7DF 0%, #F5F9FF 50%, #FFFFFF 100%)',
            boxShadow: '0 10px 30px rgba(111,92,70, 0.06)',
          }}
        >
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 h-[2px]"
            style={{
              background:
                'linear-gradient(90deg, rgba(168,148,120,0) 0%, rgba(111,92,70,0.7) 50%, rgba(168,148,120,0) 100%)',
            }}
          />
          <div className="text-center">
            <h2 className="text-[18px] font-bold text-stone-900 tracking-[-0.015em]">
              Ready to act on {winner.title}?
            </h2>
            <p className="mx-auto mt-1.5 max-w-md text-[12.5px] text-stone-600">
              Your broker will take it from here — pricing, paperwork, and visit scheduling.
            </p>
          </div>

          <div className="mx-auto mt-5 flex max-w-xl flex-col items-stretch gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => handleCreateLead('invest-now')}
              className="group inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-stone-600 px-6 py-3 text-[13px] font-semibold text-white shadow-[0_4px_14px_rgba(111,92,70,0.25)] transition-all duration-150 hover:-translate-y-0.5 hover:bg-stone-700 hover:shadow-[0_6px_20px_rgba(111,92,70,0.30)]"
            >
              <Send className="h-4 w-4" />
              Invest Now
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-0.5" />
            </button>
            <button
              type="button"
              onClick={() => handleCreateLead('contact-broker')}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-6 py-3 text-[13px] font-semibold text-stone-700 transition-all duration-150 hover:-translate-y-0.5 hover:border-stone-300 hover:bg-stone-50"
            >
              <Phone className="h-4 w-4" />
              Contact Broker
            </button>
          </div>

          {/* Validation hand-off */}
          <div className="mt-6 border-t border-stone-100 pt-5 text-center">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-stone-500">
              Still unsure?
            </p>
            <Link
              href="/investor/ai-qa"
              className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-stone-700 hover:text-stone-800"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              Validate with AI Q&A
              <ArrowRight className="h-3 w-3 transition-transform duration-150 group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      )}

      {/* Back nav */}
      <div className="flex items-center justify-between pb-8 pt-2">
        <button
          type="button"
          onClick={() => router.push('/investor/compare')}
          className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-stone-500 transition-colors duration-150 hover:text-stone-800"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Compare
        </button>
      </div>
    </PageContainer>
  );
}

/* ── Header ── */
function Header() {
  return (
    <div>
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-stone-100 bg-stone-50 px-3 py-1 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-stone-700">
          <Sparkles className="h-3 w-3" />
          Step 5 · Decision
        </span>
      </div>
      <h1 className="mt-3 text-[28px] font-bold text-stone-900 tracking-[-0.02em] leading-tight">
        Your recommended move
      </h1>
      <p className="mt-1.5 text-[13px] text-stone-500 max-w-xl">
        Based on ROI, growth outlook, and risk — the AI has a clear favorite.
      </p>
    </div>
  );
}

/* ── Winner Card ── */
function WinnerCard({
  property,
  score,
  reasons,
}: {
  property: Property;
  score: number;
  reasons: Reason[];
}) {
  const riskStyles = ({
    low:      { chip: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
    medium:   { chip: 'bg-amber-50 text-amber-700 border-amber-200',   dot: 'bg-amber-500'   },
    high:     { chip: 'bg-rose-50 text-rose-700 border-rose-200',      dot: 'bg-rose-500'    },
    critical: { chip: 'bg-rose-100 text-rose-800 border-rose-400',     dot: 'bg-rose-700'    },
  } as Record<string, { chip: string; dot: string }>)[property.riskScore] ?? { chip: 'bg-stone-50 text-stone-600 border-stone-200', dot: 'bg-stone-400' };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="relative overflow-hidden rounded-2xl border border-emerald-200 bg-white"
      style={{
        boxShadow:
          '0 16px 40px rgba(31,24,20,0.06), 0 2px 6px rgba(16,185,129,0.08)',
      }}
    >
      {/* Gold/emerald accent top bar */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-1"
        style={{
          background:
            'linear-gradient(90deg, #10B981 0%, #34D399 50%, #A89478 100%)',
        }}
      />

      <div className="grid gap-6 p-6 sm:p-7 lg:grid-cols-[auto_1fr] lg:gap-8">
        {/* Left: hero column */}
        <div className="flex flex-col items-center lg:max-w-[280px] lg:items-start">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10.5px] font-bold uppercase tracking-[0.08em] text-emerald-700">
            <Award className="h-3 w-3" />
            Top recommendation
          </span>

          {/* Score disc */}
          <div className="relative mt-4 flex h-28 w-28 items-center justify-center">
            <svg viewBox="0 0 120 120" className="absolute inset-0 h-full w-full -rotate-90">
              <circle cx="60" cy="60" r="52" fill="none" stroke="#E6E0D8" strokeWidth="8" />
              <circle
                cx="60"
                cy="60"
                r="52"
                fill="none"
                stroke="url(#winnerGrad)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${(score / 100) * 326.7} 326.7`}
              />
              <defs>
                <linearGradient id="winnerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10B981" />
                  <stop offset="100%" stopColor="#8B7355" />
                </linearGradient>
              </defs>
            </svg>
            <div className="relative text-center">
              <p className="text-[30px] font-bold tracking-[-0.02em] text-stone-900 leading-none">
                {score}
              </p>
              <p className="mt-0.5 text-[9.5px] font-semibold uppercase tracking-[0.08em] text-stone-500">
                AI Confidence
              </p>
            </div>
          </div>

          <h2
            className="mt-5 text-center text-[20px] font-bold text-stone-900 tracking-[-0.015em] lg:text-left"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            {property.title}
          </h2>
          <div className="mt-1.5 flex items-center gap-1.5 text-[12px] text-stone-500">
            <MapPin className="h-3 w-3" />
            <span>
              {property.location.neighborhood
                ? `${property.location.neighborhood}, `
                : ''}
              {property.location.city}
            </span>
          </div>

          {/* Price */}
          <div className="mt-4 w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-center lg:text-left">
            <p className="text-[9.5px] font-semibold uppercase tracking-[0.08em] text-stone-500">
              Asking price
            </p>
            <p className="mt-0.5 text-[18px] font-bold tracking-[-0.015em] text-stone-900">
              {formatCurrency(property.price)}
            </p>
          </div>
        </div>

        {/* Right: metrics + reasoning */}
        <div className="flex flex-col gap-5">
          {/* Metric chips */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <MetricTile
              icon={Brain}
              label="AI Score"
              value={`${property.aiScore}`}
              suffix="/100"
              tone="blue"
            />
            <MetricTile
              icon={DollarSign}
              label="Rental Yield"
              value={`${property.rentalYield}`}
              suffix="%"
              tone="emerald"
            />
            <MetricTile
              icon={TrendingUp}
              label="Appreciation"
              value={`+${property.capitalAppreciation}`}
              suffix="%"
              tone="blue"
            />
          </div>

          {/* Risk chip */}
          <div
            className={`inline-flex items-center gap-1.5 self-start rounded-md border px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.06em] ${riskStyles.chip}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${riskStyles.dot}`} />
            {property.riskScore} risk
          </div>

          {/* Reasoning */}
          <div>
            <p className="mb-3 flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-stone-500">
              <Sparkles className="h-3 w-3 text-stone-600" />
              Why this won
            </p>
            <ul className="space-y-2.5">
              {reasons.map((r) => {
                const RIcon = r.icon;
                return (
                  <li key={r.label} className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-emerald-50 text-emerald-600">
                      <RIcon className="h-3 w-3" strokeWidth={2.2} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[12.5px] font-semibold text-stone-900">{r.label}</p>
                      <p className="text-[12px] leading-relaxed text-stone-600">{r.detail}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Metric tile ── */
function MetricTile({
  icon: Icon,
  label,
  value,
  suffix,
  tone,
}: {
  icon: typeof Brain;
  label: string;
  value: string;
  suffix?: string;
  tone: 'blue' | 'emerald';
}) {
  const cls =
    tone === 'blue'
      ? { bg: 'bg-stone-50', fg: 'text-stone-600', text: 'text-stone-700' }
      : { bg: 'bg-emerald-50', fg: 'text-emerald-600', text: 'text-emerald-700' };
  return (
    <div className="rounded-xl border border-stone-200 bg-white px-3 py-3">
      <div
        className={`inline-flex h-7 w-7 items-center justify-center rounded-lg ${cls.bg} ${cls.fg}`}
      >
        <Icon className="h-3.5 w-3.5" strokeWidth={2} />
      </div>
      <p className="mt-2 text-[9.5px] font-semibold uppercase tracking-[0.08em] text-stone-500">
        {label}
      </p>
      <p className="mt-0.5 text-[17px] font-bold tracking-[-0.015em]">
        <span className={cls.text}>{value}</span>
        {suffix && <span className="text-[11px] font-semibold text-stone-400"> {suffix}</span>}
      </p>
    </div>
  );
}

/* ── Runners-up ── */
function RunnersUp({ properties }: { properties: Property[] }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-[0_10px_30px_rgba(31,24,20,0.04)]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-[14px] font-semibold text-stone-900 tracking-[-0.005em]">
            Also in your shortlist
          </h3>
          <p className="mt-0.5 text-[11.5px] text-stone-500">
            Strong contenders — useful as fallbacks if the top pick doesn't close.
          </p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-md bg-stone-100 px-2 py-0.5 text-[10.5px] font-semibold text-stone-600">
          {properties.length} {properties.length === 1 ? 'option' : 'options'}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {properties.map((p) => {
          const s = computeScore(p);
          return (
            <Link
              key={p.id}
              href={`/investor/properties/${p.id}`}
              className="group flex items-center gap-3 rounded-xl border border-stone-200 bg-white p-3 transition-all duration-150 hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-[0_4px_14px_rgba(31,24,20,0.06)]"
            >
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-500">
                <Star className="h-4 w-4" strokeWidth={2} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold text-stone-900">{p.title}</p>
                <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-stone-500">
                  <MapPin className="h-3 w-3" />
                  <span className="truncate">{p.location.city}</span>
                  <span className="text-stone-300">·</span>
                  <span>AI {p.aiScore}</span>
                  <span className="text-stone-300">·</span>
                  <span>{p.rentalYield}% yield</span>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <p className="text-[15px] font-bold tracking-[-0.015em] text-stone-900">{s}</p>
                <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-stone-400">
                  score
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-stone-300 transition-all duration-150 group-hover:translate-x-0.5 group-hover:text-stone-500" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
