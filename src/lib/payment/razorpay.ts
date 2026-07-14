import type { Plan } from '@/lib/plans';

const SCRIPT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

export interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface CreateOrderResult {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  planId: string;
}

export interface RazorpayCheckoutOptions {
  plan: Plan;
  order: CreateOrderResult;
  user: { name: string; email: string };
  onSuccess: (resp: RazorpaySuccessResponse) => void;
  onDismiss?: () => void;
  onError?: (err: unknown) => void;
}

interface RazorpayInstance {
  open: () => void;
  on: (event: string, handler: (payload: unknown) => void) => void;
}

interface RazorpayConstructor {
  new (options: Record<string, unknown>): RazorpayInstance;
}

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

let loaderPromise: Promise<void> | null = null;

export function loadRazorpay(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Razorpay can only load in the browser'));
  }
  if (window.Razorpay) return Promise.resolve();
  if (loaderPromise) return loaderPromise;

  loaderPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Failed to load Razorpay')), { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loaderPromise = null;
      reject(new Error('Failed to load Razorpay'));
    };
    document.body.appendChild(script);
  });

  return loaderPromise;
}

export async function createOrder(planId: string): Promise<CreateOrderResult> {
  const res = await fetch('/api/payments/create-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ planId }),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? `Order creation failed (${res.status})`);
  }
  return (await res.json()) as CreateOrderResult;
}

export async function openRazorpayCheckout({
  plan,
  order,
  user,
  onSuccess,
  onDismiss,
  onError,
}: RazorpayCheckoutOptions): Promise<void> {
  try {
    await loadRazorpay();
  } catch (err) {
    onError?.(err);
    return;
  }

  const Razorpay = window.Razorpay;
  if (!Razorpay) {
    onError?.(new Error('Razorpay failed to initialise'));
    return;
  }

  const rzp = new Razorpay({
    key: order.keyId,
    order_id: order.orderId,
    amount: order.amount,
    currency: order.currency,
    name: 'Estra Glimmora',
    description: `${plan.name} plan — platform access`,
    image: '/EstraGlimmora_logo.png',
    prefill: {
      name: user.name,
      email: user.email,
    },
    notes: {
      planId: plan.id,
      planName: plan.name,
    },
    theme: {
      color: '#C6A86B',
    },
    handler: (resp: RazorpaySuccessResponse) => {
      onSuccess(resp);
    },
    modal: {
      ondismiss: () => onDismiss?.(),
      escape: true,
      backdropclose: false,
    },
  });

  rzp.on('payment.failed', (payload: unknown) => {
    onError?.(payload);
  });

  rzp.open();
}
