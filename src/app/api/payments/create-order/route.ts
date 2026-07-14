import { NextResponse } from 'next/server';

import { getPlan } from '@/lib/plans';

export const runtime = 'nodejs';

interface CreateOrderBody {
  planId?: string;
}

interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  status: string;
}

export async function POST(request: Request) {
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return NextResponse.json(
      { error: 'Razorpay credentials missing. Set NEXT_PUBLIC_RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env.local.' },
      { status: 500 },
    );
  }

  let body: CreateOrderBody;
  try {
    body = (await request.json()) as CreateOrderBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const plan = getPlan(body.planId);
  if (!plan) {
    return NextResponse.json({ error: 'Unknown planId' }, { status: 400 });
  }

  const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
  const receipt = `plan_${plan.id}_${Date.now()}`.slice(0, 40);

  const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: plan.priceInPaise,
      currency: 'INR',
      receipt,
      notes: { planId: plan.id, planName: plan.name },
    }),
  });

  if (!rzpRes.ok) {
    const text = await rzpRes.text();
    return NextResponse.json(
      { error: 'Razorpay order creation failed', detail: text },
      { status: 502 },
    );
  }

  const order = (await rzpRes.json()) as RazorpayOrder;
  return NextResponse.json({
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId,
    planId: plan.id,
  });
}
