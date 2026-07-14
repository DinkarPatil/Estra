'use client';

/**
 * Investment Summary — flat grid of 4 independent metric cards.
 *
 * Each card:
 *  - White surface, 16px radius, soft shadow (matches the rest of the page)
 *  - 3px colored top border per metric semantic (ROI=green, Yield=blue,
 *    Risk=orange, Growth=purple)
 *  - Strong value (28px bold), small uppercase label, subtle progress bar,
 *    helper text
 *
 * No outer wrapper, no nested boxes.
 */

type RiskLevel = 'low' | 'medium' | 'high';

type Props = {
  roi: number;            // % annualized
  yield_: number;         // % net
  risk: RiskLevel;
  appreciation: number;   // % 3-year
};

const RISK_META: Record<
  RiskLevel,
  { label: string; barPct: number; barColor: string; helper: string }
> = {
  low:    { label: 'Low',    barPct: 30, barColor: '#22C55E', helper: 'Stable outlook' },
  medium: { label: 'Medium', barPct: 60, barColor: '#F59E0B', helper: 'Manageable exposure' },
  high:   { label: 'High',   barPct: 90, barColor: '#EF4444', helper: 'Active exposure' },
};

type Card = {
  label: string;
  value: string;
  helper: string;
  accent: string;    // top border color
  barPct: number;    // 0–100
  barColor: string;  // bar fill (usually same as accent, except Risk)
};

function buildCards(roi: number, yield_: number, risk: RiskLevel, appreciation: number): Card[] {
  const r = RISK_META[risk];
  /* Brand emerald for positive/neutral metrics; amber only on Risk as a
     semantic warning cue. No blue/purple — tight, investor-grade palette. */
  return [
    {
      label:    'Expected ROI',
      value:    `${roi}%`,
      helper:   'Annualized · vs 12% benchmark',
      accent:   '#166534',   // deep emerald (brand)
      barPct:   Math.min(100, roi * 5),
      barColor: '#22C55E',   // bright green for positive signal
    },
    {
      label:    'Rental Yield',
      value:    `${yield_}%`,
      helper:   'Net per year',
      accent:   '#166534',
      barPct:   Math.min(100, yield_ * 12),
      barColor: '#22C55E',
    },
    {
      label:    'Risk Level',
      value:    r.label,
      helper:   r.helper,
      accent:   '#F59E0B',   // amber — semantic warning
      barPct:   r.barPct,
      barColor: r.barColor,  // severity colour (green → amber → rose)
    },
    {
      label:    'Growth (3y)',
      value:    `${appreciation}%`,
      helper:   'Forecast · capital appreciation',
      accent:   '#166534',
      barPct:   Math.min(100, appreciation * 3),
      barColor: '#22C55E',
    },
  ];
}

export function InvestmentSummary({ roi, yield_, risk, appreciation }: Props) {
  const cards = buildCards(roi, yield_, risk, appreciation);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => (
        <MetricCard key={c.label} {...c} />
      ))}
    </div>
  );
}

/* ─── Single metric card ─── */

function MetricCard({
  label, value, helper, accent, barPct, barColor,
}: Card) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl bg-white p-6 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(31,24,20,0.08)]"
      style={{ boxShadow: '0 4px 14px rgba(31,24,20, 0.06)' }}
    >
      {/* 3px top accent — the only chrome */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-[3px]"
        style={{ background: accent }}
      />

      {/* Label */}
      <p className="text-[10.5px] font-semibold uppercase tracking-[0.10em] text-stone-500">
        {label}
      </p>

      {/* Value — dominant element */}
      <p className="mt-4 text-[30px] font-bold tracking-[-0.025em] text-stone-900 leading-none">
        {value}
      </p>

      {/* Subtle progress bar */}
      <div className="mt-4 h-1 overflow-hidden rounded-full bg-stone-100">
        <div
          className="h-full rounded-full"
          style={{
            width: `${barPct}%`,
            background: barColor,
            transition: 'width 0.6s cubic-bezier(0.25,0.46,0.45,0.94)',
          }}
        />
      </div>

      {/* Helper text */}
      <p className="mt-2 text-[11px] text-stone-500">{helper}</p>
    </div>
  );
}
