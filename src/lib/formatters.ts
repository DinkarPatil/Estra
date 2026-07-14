import type { MoneyAmount } from '@/types/common';

/**
 * Render a money amount as Indian rupees, regardless of the currency code
 * carried on the data. The MVP is INR-only, but legacy mock entries still
 * tag amounts as USD/AED/etc — the UI must always show ₹ uniformly.
 *
 * Uses lakh/crore notation:
 *   ≥ 1 Cr  → "₹X.XX Cr"
 *   ≥ 1 L   → "₹X.XX L"
 *   else    → "₹1,23,456" (Indian grouping)
 */
export function formatCurrency(money: MoneyAmount | number): string {
  const value = typeof money === 'number' ? money : money.amount;
  return formatINR(value);
}

export function formatINR(value: number): string {
  if (!Number.isFinite(value)) return '₹—';
  const v = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (v >= 1_00_00_000) return `${sign}₹${(v / 1_00_00_000).toFixed(2)} Cr`;
  if (v >= 1_00_000)    return `${sign}₹${(v / 1_00_000).toFixed(2)} L`;
  return `${sign}₹${Math.round(v).toLocaleString('en-IN')}`;
}

export function formatINRCompact(value: number): string {
  if (!Number.isFinite(value)) return '₹—';
  const v = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (v >= 1_00_00_000) return `${sign}₹${(v / 1_00_00_000).toFixed(1)}Cr`;
  if (v >= 1_00_000)    return `${sign}₹${(v / 1_00_000).toFixed(1)}L`;
  if (v >= 1_000)       return `${sign}₹${(v / 1_000).toFixed(0)}K`;
  return `${sign}₹${Math.round(v).toLocaleString('en-IN')}`;
}

export function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-IN').format(value);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
}

export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const target = new Date(date);
  const diffMs = now.getTime() - target.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(date);
}

export function formatArea(value: number, unit: 'sqft' | 'sqm'): string {
  return `${formatNumber(value)} ${unit}`;
}
