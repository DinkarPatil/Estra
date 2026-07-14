import type { MoneyAmount } from '@/types/common';

export interface PortfolioAsset {
  id: string;
  propertyId: string;
  title: string;
  location: string;
  type: string;
  purchasePrice: MoneyAmount;
  currentValue: MoneyAmount;
  purchaseDate: string;
  status: 'rented' | 'vacant' | 'listed' | 'managed' | 'under-review';
  monthlyRental?: MoneyAmount;
  occupancyRate: number; // %
  tenantName?: string;
  leaseExpiry?: string;
  appreciation: number; // %
  roi: number; // %
  maintenanceDue: number; // count of pending tasks
}

export const mockPortfolioAssets: PortfolioAsset[] = [
  {
    id: 'asset-001',
    propertyId: 'prop-001',
    title: 'Koregaon Park Apartment',
    location: 'Koregaon Park, Pune',
    type: 'Residential',
    purchasePrice: { amount: 18500000, currency: 'INR' },
    currentValue: { amount: 21200000, currency: 'INR' },
    purchaseDate: '2022-11-15',
    status: 'rented',
    monthlyRental: { amount: 72000, currency: 'INR' },
    occupancyRate: 100,
    tenantName: 'Rohan Desai (IT Professional)',
    leaseExpiry: '2025-11-30',
    appreciation: 14.6,
    roi: 7.8,
    maintenanceDue: 0,
  },
  {
    id: 'asset-002',
    propertyId: 'prop-007',
    title: 'Bandra West Flat',
    location: 'Bandra West, Mumbai',
    type: 'Residential',
    purchasePrice: { amount: 28000000, currency: 'INR' },
    currentValue: { amount: 31800000, currency: 'INR' },
    purchaseDate: '2023-03-20',
    status: 'rented',
    monthlyRental: { amount: 105000, currency: 'INR' },
    occupancyRate: 100,
    tenantName: 'Priya Kapoor (Finance Executive)',
    leaseExpiry: '2025-09-15',
    appreciation: 13.6,
    roi: 6.4,
    maintenanceDue: 2,
  },
  {
    id: 'asset-003',
    propertyId: 'prop-010',
    title: 'Viman Nagar Studio',
    location: 'Viman Nagar, Pune',
    type: 'Residential',
    purchasePrice: { amount: 7200000, currency: 'INR' },
    currentValue: { amount: 8100000, currency: 'INR' },
    purchaseDate: '2024-01-10',
    status: 'vacant',
    occupancyRate: 0,
    appreciation: 12.5,
    roi: 4.2,
    maintenanceDue: 1,
  },
];

export const portfolioSummary = {
  totalValue: { amount: 61100000, currency: 'INR' as const },
  totalInvested: { amount: 53700000, currency: 'INR' as const },
  unrealizedGain: { amount: 7400000, currency: 'INR' as const },
  monthlyRental: { amount: 177000, currency: 'INR' as const },
  avgOccupancy: 67,
  avgROI: 6.1,
  totalAssets: 3,
  portfolioHealth: 84,
};

/* ── Cash Flow ── */
export interface CashFlowEntry {
  month: string;
  income: number;
  expenses: number;
  net: number;
}

export const monthlyCashFlow: CashFlowEntry[] = [
  { month: 'Jul', income: 150000, expenses: 45000, net: 105000 },
  { month: 'Aug', income: 160000, expenses: 48000, net: 112000 },
  { month: 'Sep', income: 165000, expenses: 42000, net: 123000 },
  { month: 'Oct', income: 172000, expenses: 46000, net: 126000 },
  { month: 'Nov', income: 177000, expenses: 50000, net: 127000 },
  { month: 'Dec', income: 177000, expenses: 52000, net: 125000 },
];

export const cashFlowSummary = {
  rentIncome: 177000,
  taxes: 18000,
  maintenance: 12000,
  mortgage: 22000,
  netProfit: 125000,
};

/* ── Upcoming Actions ── */
export interface UpcomingAction {
  id: string;
  title: string;
  date: string;
  priority: 'high' | 'medium' | 'low';
  type: 'lease' | 'payment' | 'tax' | 'document' | 'maintenance';
  cta: string;
  completed: boolean;
}

export const upcomingActions: UpcomingAction[] = [
  { id: 'act-1', title: 'Lease expiring — Bandra West Flat', date: '2025-09-15', priority: 'high', type: 'lease', cta: 'Review', completed: false },
  { id: 'act-2', title: 'Q2 property tax filing due', date: '2025-06-30', priority: 'high', type: 'tax', cta: 'Pay', completed: false },
  { id: 'act-3', title: 'Maintenance inspection — Viman Nagar Studio', date: '2025-07-05', priority: 'medium', type: 'maintenance', cta: 'Schedule', completed: false },
  { id: 'act-4', title: 'Rent received — Koregaon Park Apartment', date: '2025-05-01', priority: 'low', type: 'payment', cta: 'View', completed: true },
  { id: 'act-5', title: 'Insurance renewal — All properties', date: '2025-08-15', priority: 'medium', type: 'document', cta: 'Renew', completed: false },
];

/* ── AI Insights ── */
export interface AIInsight {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  impact: string;
  confidence: number;
  action: string;
  assetId?: string;
}

export const aiInsights: AIInsight[] = [
  { id: 'ins-1', title: 'Viman Nagar unit has strong upside potential', description: 'Market data for Viman Nagar shows projected appreciation of 14–18% over 12 months. Current vacancy creates an opportunity to renovate and re-lease at ₹38,000/month.', priority: 'high', impact: '+₹9L potential gain', confidence: 86, action: 'View Asset', assetId: 'asset-003' },
  { id: 'ins-2', title: 'Bandra West ROI can be improved at renewal', description: 'Bandra West flat yields 6.4% vs Bandra micro-market average of 7.1%. At upcoming lease renewal, negotiating ₹10,000 increase pushes ROI to 7.2%.', priority: 'medium', impact: '+0.8% ROI improvement', confidence: 74, action: 'Run Scenario' },
  { id: 'ins-3', title: 'Vacancy reducing monthly yield', description: 'Viman Nagar Studio vacancy is reducing portfolio occupancy to 67%. Listing at ₹36,000/month market rate could add ₹4.3L annually to your rental income.', priority: 'high', impact: '+₹36,000/mo', confidence: 91, action: 'Resolve Risk', assetId: 'asset-003' },
  { id: 'ins-4', title: 'Refinancing Koregaon Park could improve cash flow', description: 'Current home loan rates are 0.6% below your existing rate at Koregaon Park. Refinancing could save approximately ₹8,500/month on your EMI.', priority: 'medium', impact: 'Save ₹8,500/mo', confidence: 76, action: 'Run Scenario' },
];
