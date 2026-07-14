export interface AppNotification {
  id: string;
  type: 'ai-insight' | 'property-update' | 'transaction' | 'system';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

export const mockNotifications: AppNotification[] = [
  {
    id: 'n1',
    type: 'transaction',
    title: 'Rent Payment Received — Marina Bay',
    message: 'Monthly rental payment of $18,000 from Corporate Client – TechCo Singapore has been credited to your account.',
    timestamp: '2026-04-18T09:00:00Z',
    read: false,
    actionUrl: '/investor/portfolio',
  },
  {
    id: 'n2',
    type: 'property-update',
    title: 'Lease Expiring Soon — Minato-ku Residence',
    message: 'Tenant Kenji Yamamoto\'s lease expires on June 14, 2025. Review renewal options before deadline.',
    timestamp: '2026-04-17T14:00:00Z',
    read: false,
    actionUrl: '/investor/portfolio',
  },
  {
    id: 'n3',
    type: 'ai-insight',
    title: 'AI Detected Opportunity — South Beach Condo',
    message: 'Market indicators suggest 12-18% appreciation potential in South Beach area. Current vacancy creates renovation opportunity.',
    timestamp: '2026-04-16T10:30:00Z',
    read: false,
    actionUrl: '/investor/portfolio',
  },
  {
    id: 'n4',
    type: 'system',
    title: 'Maintenance Task Pending',
    message: 'Miami Condo has 1 pending maintenance inspection due July 5. Schedule before deadline.',
    timestamp: '2026-04-15T16:00:00Z',
    read: false,
    actionUrl: '/investor/portfolio',
  },
  {
    id: 'n5',
    type: 'system',
    title: 'Export Report Completed',
    message: 'Your Q1 2026 portfolio performance report has been generated and is ready for download.',
    timestamp: '2026-04-14T08:00:00Z',
    read: true,
    actionUrl: '/investor/portfolio',
  },
  {
    id: 'n6',
    type: 'ai-insight',
    title: 'Refinance Opportunity — Marina Bay',
    message: 'Current rates are 0.8% below your mortgage. Refinancing could save approximately $1,100/month.',
    timestamp: '2026-04-13T11:30:00Z',
    read: true,
    actionUrl: '/investor/portfolio',
  },
  {
    id: 'n7',
    type: 'property-update',
    title: 'Valuation Updated — All Properties',
    message: 'Quarterly automated valuations have been refreshed. Total portfolio value: $2.8M (+10.7% YTD).',
    timestamp: '2026-04-12T09:00:00Z',
    read: true,
  },
  {
    id: 'n8',
    type: 'transaction',
    title: 'Insurance Renewal Due',
    message: 'Property insurance for all 3 assets is due for renewal by August 15. Compare rates to optimize coverage.',
    timestamp: '2026-04-10T08:00:00Z',
    read: true,
    actionUrl: '/investor/portfolio',
  },
];
