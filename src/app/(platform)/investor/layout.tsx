'use client';

import { InvestorFunnelProvider } from '@/contexts/investor-funnel-context';

export default function InvestorLayout({ children }: { children: React.ReactNode }) {
  return <InvestorFunnelProvider>{children}</InvestorFunnelProvider>;
}
