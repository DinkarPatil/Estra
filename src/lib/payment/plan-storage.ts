import type { PlanId } from '@/lib/plans';

/**
 * Plan persistence is now backend-owned (one row per user in the
 * ``user_plans`` table). The only client-side state we maintain is the
 * ``glimmora-plan`` cookie that the Next.js middleware reads to gate
 * platform routes before React hydrates. The cookie is rewritten on
 * every login / hydration from the backend response.
 *
 * Legacy localStorage entries from earlier iterations are pruned here so
 * stale data can't leak across browsers or accounts.
 */

const PLAN_COOKIE = 'glimmora-plan';
const PLAN_MAX_AGE = 60 * 60 * 24 * 30;
const SKIP_PLAN_KEY = 'glimmora-skip-plan';

const LEGACY_KEYS = [
  'glimmora-payment',
  'glimmora-plans',
];

export function setSkipPlan(planId: PlanId): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(SKIP_PLAN_KEY, planId);
}

export function getSkipPlan(): PlanId | null {
  if (typeof window === 'undefined') return null;
  const v = window.localStorage.getItem(SKIP_PLAN_KEY);
  return v === 'basic' || v === 'pro' || v === 'enterprise' ? v : null;
}

export function clearSkipPlan(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(SKIP_PLAN_KEY);
}

export function setPlanCookie(planId: PlanId): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${PLAN_COOKIE}=${encodeURIComponent(planId)}; path=/; max-age=${PLAN_MAX_AGE}; samesite=lax`;
}

export function clearPlanCookie(): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${PLAN_COOKIE}=; path=/; max-age=0; samesite=lax`;
}

export function pruneLegacyClientPlanState(): void {
  if (typeof window === 'undefined') return;
  for (const key of LEGACY_KEYS) {
    window.localStorage.removeItem(key);
  }
}
