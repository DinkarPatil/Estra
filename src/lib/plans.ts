export type PlanId = 'basic' | 'pro' | 'enterprise';

export interface Plan {
  id: PlanId;
  name: string;
  tagline: string;
  /** Price in INR rupees (display + payment amount). */
  price: number;
  /** Price in paise — what Razorpay expects. */
  priceInPaise: number;
  features: string[];
  highlight?: boolean;
}

export const PLANS: Plan[] = [
  {
    id: 'basic',
    name: 'Basic',
    tagline: 'Get started on the platform',
    price: 1,
    priceInPaise: 100,
    features: [
      'Property search & discovery',
      'Standard portfolio view',
      'Community insights',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'For active investors',
    price: 2,
    priceInPaise: 200,
    features: [
      'Everything in Basic',
      'AI-powered analytics',
      'Priority concierge support',
      'Advanced lending tools',
    ],
    highlight: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    tagline: 'For institutions & developers',
    price: 3,
    priceInPaise: 300,
    features: [
      'Everything in Pro',
      'Institutional dashboards',
      'Dedicated account manager',
      'Custom integrations & SLAs',
    ],
  },
];

export function getPlan(id: string | null | undefined): Plan | null {
  if (!id) return null;
  return PLANS.find(p => p.id === id) ?? null;
}
