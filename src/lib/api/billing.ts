import { apiFetch } from './client';
import type { PlanId } from '@/lib/plans';

export interface BackendUserPlan {
  plan_id: PlanId;
  payment_id: string;
  order_id: string | null;
  amount_paise: number;
  currency: string;
  paid_at: string;
}

export interface MePlanResponse {
  plan: BackendUserPlan | null;
}

export interface VerifyPaymentPayload {
  plan_id: PlanId;
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
  amount_paise: number;
}

export function getMyPlan() {
  return apiFetch<MePlanResponse>('/me/plan', { auth: true });
}

export function verifyPayment(payload: VerifyPaymentPayload) {
  return apiFetch<MePlanResponse>('/payments/verify', {
    method: 'POST',
    auth: true,
    body: payload,
  });
}
