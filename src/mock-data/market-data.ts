import type { TimeSeriesPoint, ChartDataPoint } from '@/types/common';

export const portfolioValueHistory: TimeSeriesPoint[] = [
  { date: '2024-01', value: 2000000 },
  { date: '2024-02', value: 2050000 },
  { date: '2024-03', value: 2035000 },
  { date: '2024-04', value: 2120000 },
  { date: '2024-05', value: 2180000 },
  { date: '2024-06', value: 2150000 },
  { date: '2024-07', value: 2260000 },
  { date: '2024-08', value: 2340000 },
  { date: '2024-09', value: 2310000 },
  { date: '2024-10', value: 2480000 },
  { date: '2024-11', value: 2620000 },
  { date: '2024-12', value: 2800000 },
];

export const assetAllocation: ChartDataPoint[] = [
  { label: 'Residential', value: 45 },
  { label: 'Commercial', value: 25 },
  { label: 'Land', value: 15 },
  { label: 'Mixed-Use', value: 10 },
  { label: 'Industrial', value: 5 },
];

export const rentalIncomeHistory: TimeSeriesPoint[] = [
  { date: '2024-01', value: 8200 },
  { date: '2024-02', value: 8350 },
  { date: '2024-03', value: 8400 },
  { date: '2024-04', value: 8900 },
  { date: '2024-05', value: 9100 },
  { date: '2024-06', value: 9050 },
  { date: '2024-07', value: 9600 },
  { date: '2024-08', value: 10200 },
  { date: '2024-09', value: 10100 },
  { date: '2024-10', value: 10800 },
  { date: '2024-11', value: 11300 },
  { date: '2024-12', value: 11850 },
];

export const marketTrends: {
  region: string;
  growth: number;
  yield: number;
  demand: 'high' | 'medium' | 'low';
}[] = [
  { region: 'Dubai', growth: 12.5, yield: 7.2, demand: 'high' },
  { region: 'Singapore', growth: 8.3, yield: 4.8, demand: 'high' },
  { region: 'London', growth: 4.1, yield: 3.5, demand: 'medium' },
  { region: 'New York', growth: 6.7, yield: 4.2, demand: 'high' },
  { region: 'Mumbai', growth: 15.2, yield: 5.5, demand: 'high' },
  { region: 'Tokyo', growth: 3.8, yield: 3.2, demand: 'medium' },
  { region: 'Sydney', growth: 7.1, yield: 4.0, demand: 'medium' },
  { region: 'Paris', growth: 5.4, yield: 3.8, demand: 'medium' },
];

// Broker dashboard mock data
export const brokerLeads = [
  {
    id: 'lead-001',
    name: 'Khalid Al-Rashid',
    email: 'khalid@email.com',
    phone: '+971 50 123 4567',
    budget: { amount: 20000000, currency: 'AED' as const },
    location: 'Dubai, UAE',
    interest: 'Villa',
    score: 95,
    status: 'hot' as const,
    createdAt: '2025-01-20T08:00:00Z',
  },
  {
    id: 'lead-002',
    name: 'Arjun Mehta',
    email: 'arjun@email.com',
    phone: '+91 98765 43210',
    budget: { amount: 50000000, currency: 'INR' as const },
    location: 'Mumbai, India',
    interest: 'Luxury Residential',
    score: 92,
    status: 'hot' as const,
    createdAt: '2025-01-15T08:00:00Z',
  },
  {
    id: 'lead-003',
    name: 'Takeshi Yamada',
    email: 'takeshi@email.com',
    phone: '+81 90 1234 5678',
    budget: { amount: 300000000, currency: 'JPY' as const },
    location: 'Tokyo, Japan',
    interest: 'Investment Property',
    score: 83,
    status: 'warm' as const,
    createdAt: '2025-01-25T08:00:00Z',
  },
  {
    id: 'lead-004',
    name: 'Sofia Andersson',
    email: 'sofia@email.com',
    phone: '+46 70 123 4567',
    budget: { amount: 2000000, currency: 'EUR' as const },
    location: 'Stockholm, Sweden',
    interest: 'Commercial Office',
    score: 78,
    status: 'warm' as const,
    createdAt: '2025-01-18T08:00:00Z',
  },
  {
    id: 'lead-005',
    name: 'Emma Fitzgerald',
    email: 'emma@email.com',
    phone: '+44 7700 900123',
    budget: { amount: 5000000, currency: 'GBP' as const },
    location: 'London, UK',
    interest: 'Penthouse',
    score: 65,
    status: 'cold' as const,
    createdAt: '2025-01-22T08:00:00Z',
  },
];

// Developer dashboard mock data
export const developerProjects = [
  {
    id: 'proj-001',
    name: 'Azure Heights',
    location: 'Dubai Marina',
    totalUnits: 250,
    soldUnits: 180,
    avgPrice: { amount: 850000, currency: 'AED' as const },
    completionDate: '2025-06-30',
    status: 'under-construction' as const,
  },
  {
    id: 'proj-002',
    name: 'Green Valley Residences',
    location: 'Dubai Hills',
    totalUnits: 120,
    soldUnits: 95,
    avgPrice: { amount: 1200000, currency: 'AED' as const },
    completionDate: '2024-12-31',
    status: 'near-completion' as const,
  },
  {
    id: 'proj-003',
    name: 'Skyline Tower',
    location: 'Downtown Dubai',
    totalUnits: 400,
    soldUnits: 120,
    avgPrice: { amount: 2500000, currency: 'AED' as const },
    completionDate: '2026-03-15',
    status: 'pre-launch' as const,
  },
];

// Admin dashboard mock data
export const systemMetrics = {
  totalUsers: 12450,
  activeSessionsNow: 342,
  systemUptime: 99.97,
  aiRequestsToday: 8543,
  apiCallsToday: 125000,
  avgResponseTime: 145,
  errorRate: 0.12,
  storageUsed: 78.5,
};

export const recentAuditLogs = [
  {
    id: 'log-001',
    user: 'admin@glimmora.com',
    action: 'User role updated',
    target: 'john@example.com',
    timestamp: '2024-12-20T15:30:00Z',
    severity: 'info' as const,
  },
  {
    id: 'log-002',
    user: 'system',
    action: 'Failed login attempt',
    target: 'unknown@spam.com',
    timestamp: '2024-12-20T14:22:00Z',
    severity: 'warning' as const,
  },
  {
    id: 'log-003',
    user: 'broker@glimmora.com',
    action: 'Property listing created',
    target: 'prop-new-001',
    timestamp: '2024-12-20T13:15:00Z',
    severity: 'info' as const,
  },
  {
    id: 'log-004',
    user: 'system',
    action: 'Database backup completed',
    target: 'pg-main',
    timestamp: '2024-12-20T12:00:00Z',
    severity: 'info' as const,
  },
  {
    id: 'log-005',
    user: 'admin@glimmora.com',
    action: 'API key regenerated',
    target: 'partner-xyz',
    timestamp: '2024-12-20T11:45:00Z',
    severity: 'warning' as const,
  },
];
