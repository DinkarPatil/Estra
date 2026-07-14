'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, MapPin, Eye, Phone, Send, TrendingUp,
  Loader2, CheckCircle2, Check, ChevronDown,
} from 'lucide-react';

export type UnitStatus = 'available' | 'reserved' | 'sold';
export type UnitType = 'Apartment' | 'Villa' | 'Retail' | 'Penthouse' | 'Townhouse';

export type Unit = {
  id: string;
  unit: string;
  project: string;
  location: string;
  type: UnitType;
  area: number;       // sqft
  price: string;      // pre-formatted
  priceValue: number; // numeric (for filtering)
  roi: number;        // %
  demand: number;     // 0–100
  status: UnitStatus;
  tags: string[];
  image?: string;
};

const STATUS_META: Record<
  UnitStatus,
  { label: string; chip: string; dot: string }
> = {
  available: { label: 'Available', chip: 'bg-[#DCFCE7] text-[#166534]',  dot: 'bg-[#22C55E]' },
  reserved:  { label: 'Reserved',  chip: 'bg-amber-50 text-amber-700',   dot: 'bg-amber-500' },
  sold:      { label: 'Sold',      chip: 'bg-stone-100 text-stone-500',  dot: 'bg-stone-400' },
};

const TYPE_IMAGE: Record<UnitType, string> = {
  Apartment: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=500&fit=crop&q=80',
  Villa:     'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&h=500&fit=crop&q=80',
  Retail:    'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=800&h=500&fit=crop&q=80',
  Penthouse: 'https://images.unsplash.com/photo-1567684014761-b65e2e59b9eb?w=800&h=500&fit=crop&q=80',
  Townhouse: 'https://images.unsplash.com/photo-1605146769289-440113cc3d00?w=800&h=500&fit=crop&q=80',
};
const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=500&fit=crop&q=80';

function demandTone(d: number) {
  if (d >= 80) return { label: 'Very High' };
  if (d >= 60) return { label: 'High' };
  if (d >= 40) return { label: 'Steady' };
  return { label: 'Low' };
}

type ActionState = 'idle' | 'loading' | 'done';

export function UnitCard({ unit }: { unit: Unit }) {
  const s = STATUS_META[unit.status];
  const isSold = unit.status === 'sold';

  const [expanded, setExpanded] = useState(false);
  const [investState, setInvestState] = useState<ActionState>('idle');
  const [brokerState, setBrokerState] = useState<ActionState>('idle');

  const isInPipeline = investState === 'done';
  const isContacted = brokerState === 'done';

  /** Invest — simulated commitment + state change */
  async function handleInvest() {
    if (isSold || investState !== 'idle') return;
    setInvestState('loading');
    await new Promise((r) => setTimeout(r, 800));
    setInvestState('done');
  }

  /** Broker — simulated outreach */
  async function handleBroker() {
    if (brokerState !== 'idle') return;
    setBrokerState('loading');
    await new Promise((r) => setTimeout(r, 600));
    setBrokerState('done');
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={`group relative flex flex-col overflow-hidden rounded-2xl bg-white transition-[box-shadow,transform] duration-200 ease-out hover:-translate-y-[2px] hover:shadow-[0_8px_22px_rgba(31,24,20,0.07)] ${
        isInPipeline ? 'ring-1 ring-[#166534]/20' : ''
      }`}
      style={{ boxShadow: '0 1px 3px rgba(31,24,20, 0.05)' }}
    >
      {/* ── Top image ── */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-stone-100">
        <img
          src={unit.image ?? TYPE_IMAGE[unit.type] ?? FALLBACK_IMAGE}
          alt={unit.unit}
          loading="lazy"
          className="h-full w-full object-cover transition-[filter] duration-300 group-hover:brightness-[1.04]"
          onError={(e) => {
            const t = e.currentTarget;
            if (t.src !== FALLBACK_IMAGE) t.src = FALLBACK_IMAGE;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/65 via-stone-950/15 to-transparent" />

        {/* ROI badge — top right */}
        <div className="absolute right-3 top-3">
          <span className="inline-flex items-center gap-1 rounded-lg bg-[#DCFCE7] px-2.5 py-1 text-[11.5px] font-bold text-[#166534] shadow-[0_2px_8px_rgba(0,0,0,0.12)]">
            <TrendingUp className="h-3 w-3" strokeWidth={2.4} />
            {unit.roi}% ROI
          </span>
        </div>

        {/* Title + location on image */}
        <div className="absolute inset-x-0 bottom-0 px-4 pb-4">
          <h3
            className="truncate text-[17px] font-semibold text-white leading-tight tracking-[-0.01em]"
            style={{ textShadow: '0 1px 10px rgba(0,0,0,0.3)' }}
          >
            {unit.unit}
          </h3>
          <div className="mt-1 flex items-center gap-1.5 text-[11.5px] text-white/85">
            <Building2 className="h-3 w-3" />
            <span className="truncate">{unit.project}</span>
            <span className="text-white/40">·</span>
            <MapPin className="h-3 w-3" />
            <span className="truncate">{unit.location}</span>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-1 flex-col gap-4 p-6">
        {/* Pipeline confirmation chip — only after invest */}
        <AnimatePresence>
          {isInPipeline && (
            <motion.div
              initial={{ opacity: 0, y: -4, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -4, height: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="inline-flex items-center gap-1.5 rounded-md bg-[#DCFCE7] px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.05em] text-[#166534]">
                <CheckCircle2 className="h-3 w-3" strokeWidth={2.4} />
                In your pipeline
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Price + Status — the two things that matter at a glance */}
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-stone-500">
              Asking Price
            </p>
            <p className="mt-1 text-[24px] font-bold tracking-[-0.02em] text-stone-900 leading-none">
              {unit.price}
            </p>
          </div>
          <span
            className={`inline-flex flex-shrink-0 items-center gap-1.5 rounded-md px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.05em] ${s.chip}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
            {s.label}
          </span>
        </div>

        {/* Quiet meta line */}
        <p className="text-[12px] text-stone-500">
          {unit.area.toLocaleString()} sqft · {unit.type}
        </p>

        {/* ── Expandable detail section — revealed via View ── */}
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="overflow-hidden"
            >
              <div className="space-y-3 border-t border-stone-100 pt-4">
                {/* Demand */}
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-stone-500">
                      Investor demand
                    </span>
                    <span className="text-[12px] font-semibold text-stone-900">
                      {unit.demand}<span className="text-stone-400">/100</span>
                      <span className="ml-1.5 text-[10.5px] font-medium text-[#166534]">
                        {demandTone(unit.demand).label}
                      </span>
                    </span>
                  </div>
                  <div className="h-1 overflow-hidden rounded-full bg-stone-100">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${unit.demand}%` }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                      className="h-full rounded-full bg-[#22C55E]"
                    />
                  </div>
                </div>

                {/* Tags */}
                {unit.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {unit.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center rounded-md bg-stone-100 px-2 py-0.5 text-[10.5px] font-medium text-stone-700"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Button ladder: Secondary · Primary · Tertiary ── */}
        <div className="mt-auto grid grid-cols-3 gap-2">
          {/* View — outline, toggles detail */}
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            className="inline-flex items-center justify-center gap-1 rounded-[10px] border border-stone-200 bg-transparent px-2 py-2 text-[11.5px] font-medium text-stone-700 transition-all duration-200 ease-out hover:border-stone-300 hover:bg-[#F3EFEA]"
          >
            <Eye className="h-3 w-3" />
            <span>{expanded ? 'Hide' : 'View'}</span>
            <ChevronDown
              className={`h-3 w-3 text-stone-400 transition-transform duration-200 ${
                expanded ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Invest — primary, commitment with state transition */}
          <InvestButton
            state={investState}
            isSold={isSold}
            onClick={handleInvest}
          />

          {/* Broker — tertiary ghost, initiates outreach */}
          <BrokerButton
            state={brokerState}
            onClick={handleBroker}
          />
        </div>

        {/* After-invest subtle footnote — reinforces the commitment landed */}
        <AnimatePresence>
          {isInPipeline && (
            <motion.p
              initial={{ opacity: 0, y: -2 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="-mt-1 text-[10.5px] text-stone-500"
            >
              Your broker has been notified. They'll reach out within 24 hours.
            </motion.p>
          )}
          {isContacted && !isInPipeline && (
            <motion.p
              initial={{ opacity: 0, y: -2 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="-mt-1 text-[10.5px] text-stone-500"
            >
              Request sent · your broker will reply shortly.
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/* ─── Primary button — Invest ─── */

function InvestButton({
  state,
  isSold,
  onClick,
}: {
  state: ActionState;
  isSold: boolean;
  onClick: () => void;
}) {
  if (isSold) {
    return (
      <button
        type="button"
        disabled
        className="inline-flex cursor-not-allowed items-center justify-center gap-1.5 rounded-[10px] bg-stone-100 px-2 py-2 text-[11.5px] font-semibold text-stone-400"
      >
        Sold
      </button>
    );
  }

  // Done state — soft green pill, locked (no more action)
  if (state === 'done') {
    return (
      <button
        type="button"
        disabled
        className="inline-flex cursor-default items-center justify-center gap-1.5 rounded-[10px] bg-[#DCFCE7] px-2 py-2 text-[11.5px] font-semibold text-[#166534]"
      >
        <Check className="h-3 w-3" strokeWidth={2.4} />
        In pipeline
      </button>
    );
  }

  const loading = state === 'loading';
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={`inline-flex items-center justify-center gap-1.5 rounded-[10px] bg-[#166534] px-2 py-2 text-[11.5px] font-semibold text-white shadow-[0_1px_2px_rgba(22,101,52,0.18)] transition-all duration-200 ease-out ${
        loading
          ? 'cursor-wait'
          : 'hover:-translate-y-px hover:bg-[#14532D] hover:shadow-[0_3px_8px_rgba(22,101,52,0.22),0_1px_3px_rgba(22,101,52,0.15)] active:translate-y-0 active:shadow-[0_1px_2px_rgba(22,101,52,0.18)]'
      }`}
    >
      {loading ? (
        <>
          <Loader2 className="h-3 w-3 animate-spin" />
          Adding
        </>
      ) : (
        <>
          <Send className="h-3 w-3" />
          Invest
        </>
      )}
    </button>
  );
}

/* ─── Tertiary button — Broker ─── */

function BrokerButton({
  state,
  onClick,
}: {
  state: ActionState;
  onClick: () => void;
}) {
  if (state === 'done') {
    return (
      <button
        type="button"
        disabled
        className="inline-flex cursor-default items-center justify-center gap-1.5 rounded-[10px] bg-transparent px-2 py-2 text-[11.5px] font-medium text-[#166534]"
      >
        <Check className="h-3 w-3" strokeWidth={2.4} />
        Contacted
      </button>
    );
  }

  const loading = state === 'loading';
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={`inline-flex items-center justify-center gap-1.5 rounded-[10px] bg-transparent px-2 py-2 text-[11.5px] font-medium transition-all duration-200 ease-out ${
        loading
          ? 'cursor-wait text-stone-500'
          : 'text-stone-500 hover:bg-stone-50 hover:text-stone-700'
      }`}
    >
      {loading ? (
        <>
          <Loader2 className="h-3 w-3 animate-spin" />
          Connecting
        </>
      ) : (
        <>
          <Phone className="h-3 w-3" />
          Broker
        </>
      )}
    </button>
  );
}
