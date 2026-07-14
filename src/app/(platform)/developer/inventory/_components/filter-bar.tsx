'use client';

import { Search, SlidersHorizontal, X } from 'lucide-react';
import type { UnitStatus, UnitType } from './unit-card';

export type RiskFilter = 'any' | 'low' | 'medium' | 'high';
export type StatusFilter = 'any' | UnitStatus;
export type TypeFilter = 'any' | UnitType;

export type FilterState = {
  query: string;
  type: TypeFilter;
  status: StatusFilter;
  risk: RiskFilter;
  minBudget: number;      // AED millions
  maxBudget: number;      // AED millions
  minRoi: number;         // %
  maxRoi: number;         // %
  location: string;       // substring match
};

export const DEFAULT_FILTERS: FilterState = {
  query: '',
  type: 'any',
  status: 'any',
  risk: 'any',
  minBudget: 0,
  maxBudget: 20,  // 20M AED
  minRoi: 0,
  maxRoi: 25,
  location: '',
};

const TYPE_OPTIONS: { v: TypeFilter; label: string }[] = [
  { v: 'any', label: 'Any type' },
  { v: 'Apartment', label: 'Apartment' },
  { v: 'Villa', label: 'Villa' },
  { v: 'Retail', label: 'Retail' },
  { v: 'Penthouse', label: 'Penthouse' },
  { v: 'Townhouse', label: 'Townhouse' },
];

const STATUS_OPTIONS: { v: StatusFilter; label: string }[] = [
  { v: 'any', label: 'Any status' },
  { v: 'available', label: 'Available' },
  { v: 'reserved',  label: 'Reserved' },
  { v: 'sold',      label: 'Sold' },
];

const RISK_OPTIONS: { v: RiskFilter; label: string }[] = [
  { v: 'any', label: 'Any risk' },
  { v: 'low',    label: 'Low' },
  { v: 'medium', label: 'Medium' },
  { v: 'high',   label: 'High' },
];

type Props = {
  filters: FilterState;
  onChange: (next: FilterState) => void;
  resultCount: number;
  totalCount: number;
};

export function FilterBar({ filters, onChange, resultCount, totalCount }: Props) {
  const update = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    onChange({ ...filters, [key]: value });
  };

  const hasActiveFilters =
    filters.query !== '' ||
    filters.type !== 'any' ||
    filters.status !== 'any' ||
    filters.risk !== 'any' ||
    filters.location !== '' ||
    filters.minBudget !== DEFAULT_FILTERS.minBudget ||
    filters.maxBudget !== DEFAULT_FILTERS.maxBudget ||
    filters.minRoi !== DEFAULT_FILTERS.minRoi ||
    filters.maxRoi !== DEFAULT_FILTERS.maxRoi;

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-[0_10px_30px_rgba(31,24,20,0.04)]">
      {/* Top row: search + reset */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={filters.query}
            onChange={(e) => update('query', e.target.value)}
            placeholder="Search unit, project, or tag…"
            className="w-full rounded-lg border border-[#CBD5F5] bg-[#F9F7F4] py-2 pl-9 pr-3 text-[13px] text-stone-900 placeholder:text-stone-400 transition-all duration-150 hover:border-[#C4B19A] focus:border-[#166534] focus:bg-white focus:outline-none focus:shadow-[0_0_0_3px_rgba(22,101,52,0.15)]"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-stone-50 px-2.5 py-1.5 text-[11.5px] font-medium text-stone-600">
            <SlidersHorizontal className="h-3 w-3" />
            <span className="font-semibold text-stone-900">{resultCount}</span>
            <span className="text-stone-400">/</span>
            <span>{totalCount}</span>
          </span>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => onChange(DEFAULT_FILTERS)}
              className="inline-flex items-center gap-1 rounded-md border border-stone-200 bg-white px-2.5 py-1.5 text-[11.5px] font-medium text-stone-600 transition-colors duration-150 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
            >
              <X className="h-3 w-3" />
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Second row: selects */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Select
          label="Type"
          value={filters.type}
          onChange={(v) => update('type', v as TypeFilter)}
          options={TYPE_OPTIONS.map(o => ({ v: o.v, label: o.label }))}
        />
        <Select
          label="Status"
          value={filters.status}
          onChange={(v) => update('status', v as StatusFilter)}
          options={STATUS_OPTIONS.map(o => ({ v: o.v, label: o.label }))}
        />
        <Select
          label="Risk"
          value={filters.risk}
          onChange={(v) => update('risk', v as RiskFilter)}
          options={RISK_OPTIONS.map(o => ({ v: o.v, label: o.label }))}
        />
        <div>
          <label className="block text-[10.5px] font-semibold uppercase tracking-[0.08em] text-stone-500 mb-1.5">Location</label>
          <input
            type="text"
            value={filters.location}
            onChange={(e) => update('location', e.target.value)}
            placeholder="e.g. Dubai Marina"
            className="w-full rounded-lg border border-[#CBD5F5] bg-[#F9F7F4] px-3 py-1.5 text-[12.5px] text-stone-900 placeholder:text-stone-400 transition-all duration-150 focus:border-[#166534] focus:bg-white focus:outline-none focus:shadow-[0_0_0_3px_rgba(22,101,52,0.15)]"
          />
        </div>
      </div>

      {/* Third row: range sliders */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <RangeRow
          label="Budget (AED millions)"
          min={0}
          max={20}
          step={0.5}
          low={filters.minBudget}
          high={filters.maxBudget}
          onChange={(lo, hi) => onChange({ ...filters, minBudget: lo, maxBudget: hi })}
          formatValue={(v) => `${v}M`}
        />
        <RangeRow
          label="ROI (%)"
          min={0}
          max={25}
          step={0.5}
          low={filters.minRoi}
          high={filters.maxRoi}
          onChange={(lo, hi) => onChange({ ...filters, minRoi: lo, maxRoi: hi })}
          formatValue={(v) => `${v}%`}
        />
      </div>
    </div>
  );
}

/* ── Select ── */
function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { v: string; label: string }[];
}) {
  return (
    <div>
      <label className="block text-[10.5px] font-semibold uppercase tracking-[0.08em] text-stone-500 mb-1.5">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-[#CBD5F5] bg-[#F9F7F4] px-3 py-1.5 text-[12.5px] text-stone-900 transition-all duration-150 focus:border-[#166534] focus:bg-white focus:outline-none focus:shadow-[0_0_0_3px_rgba(22,101,52,0.15)]"
      >
        {options.map((o) => (
          <option key={o.v} value={o.v}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

/* ── Dual range (two independent sliders stacked) ── */
function RangeRow({
  label, min, max, step, low, high, onChange, formatValue,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  low: number;
  high: number;
  onChange: (lo: number, hi: number) => void;
  formatValue: (v: number) => string;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-stone-500">{label}</span>
        <span className="text-[11px] font-medium text-stone-700">
          {formatValue(low)} <span className="text-stone-400">–</span> {formatValue(high)}
        </span>
      </div>
      <div className="flex gap-2">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={low}
          onChange={(e) => {
            const v = Number(e.target.value);
            onChange(Math.min(v, high), high);
          }}
          className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-stone-200 accent-[#166534]"
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={high}
          onChange={(e) => {
            const v = Number(e.target.value);
            onChange(low, Math.max(v, low));
          }}
          className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-stone-200 accent-[#166534]"
        />
      </div>
    </div>
  );
}
