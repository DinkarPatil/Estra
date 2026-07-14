import type { MoneyAmount } from '@/types/common';

export type TransactionStatus = 'pending' | 'in-progress' | 'completed' | 'cancelled';
export type TransactionStage = 'offer' | 'due-diligence' | 'financing' | 'legal' | 'closing' | 'closed';

export interface Transaction {
  id: string;
  propertyId: string;
  propertyTitle: string;
  propertyLocation: string;
  amount: MoneyAmount;
  status: TransactionStatus;
  stage: TransactionStage;
  stageProgress: number; // 0-100
  buyerId: string;
  sellerId: string;
  agentName: string;
  escrowAmount: MoneyAmount;
  closingDate: string;
  createdAt: string;
  documents: { id: string; name: string; status: 'pending' | 'signed' | 'uploaded' }[];
  milestones: { label: string; completed: boolean; date?: string }[];
}

export const mockTransactions: Transaction[] = [
  {
    id: 'txn-001',
    propertyId: 'prop-002',
    propertyTitle: 'Palm Jumeirah Villa',
    propertyLocation: 'Dubai, UAE',
    amount: { amount: 15000000, currency: 'AED' },
    status: 'in-progress',
    stage: 'due-diligence',
    stageProgress: 45,
    buyerId: 'inv-001',
    sellerId: 'dev-001',
    agentName: 'James Okafor',
    escrowAmount: { amount: 1500000, currency: 'AED' },
    closingDate: '2025-03-15',
    createdAt: '2024-12-01T08:00:00Z',
    documents: [
      { id: 'doc-001', name: 'Sale Agreement', status: 'signed' },
      { id: 'doc-002', name: 'Title Deed', status: 'uploaded' },
      { id: 'doc-003', name: 'NOC Certificate', status: 'pending' },
      { id: 'doc-004', name: 'Valuation Report', status: 'uploaded' },
    ],
    milestones: [
      { label: 'Offer Submitted', completed: true, date: '2024-12-01' },
      { label: 'Offer Accepted', completed: true, date: '2024-12-05' },
      { label: 'Escrow Funded', completed: true, date: '2024-12-10' },
      { label: 'Due Diligence', completed: false },
      { label: 'Final Payment', completed: false },
      { label: 'Title Transfer', completed: false },
    ],
  },
  {
    id: 'txn-002',
    propertyId: 'prop-001',
    propertyTitle: 'Marina Bay Penthouse',
    propertyLocation: 'Singapore',
    amount: { amount: 4500000, currency: 'USD' },
    status: 'completed',
    stage: 'closed',
    stageProgress: 100,
    buyerId: 'inv-001',
    sellerId: 'dev-002',
    agentName: 'Lisa Martinez',
    escrowAmount: { amount: 450000, currency: 'USD' },
    closingDate: '2024-10-30',
    createdAt: '2024-09-15T08:00:00Z',
    documents: [
      { id: 'doc-005', name: 'Sale Agreement', status: 'signed' },
      { id: 'doc-006', name: 'Title Deed', status: 'signed' },
      { id: 'doc-007', name: 'Stamp Duty Receipt', status: 'uploaded' },
    ],
    milestones: [
      { label: 'Offer Submitted', completed: true, date: '2024-09-15' },
      { label: 'Offer Accepted', completed: true, date: '2024-09-18' },
      { label: 'Escrow Funded', completed: true, date: '2024-09-22' },
      { label: 'Due Diligence', completed: true, date: '2024-10-10' },
      { label: 'Final Payment', completed: true, date: '2024-10-28' },
      { label: 'Title Transfer', completed: true, date: '2024-10-30' },
    ],
  },
  {
    id: 'txn-003',
    propertyId: 'prop-005',
    propertyTitle: 'Manhattan Skyline Apartment',
    propertyLocation: 'New York, USA',
    amount: { amount: 6200000, currency: 'USD' },
    status: 'pending',
    stage: 'offer',
    stageProgress: 10,
    buyerId: 'inv-001',
    sellerId: 'dev-003',
    agentName: 'James Okafor',
    escrowAmount: { amount: 620000, currency: 'USD' },
    closingDate: '2025-04-30',
    createdAt: '2024-12-18T08:00:00Z',
    documents: [
      { id: 'doc-008', name: 'Letter of Intent', status: 'signed' },
      { id: 'doc-009', name: 'Sale Agreement', status: 'pending' },
    ],
    milestones: [
      { label: 'Offer Submitted', completed: true, date: '2024-12-18' },
      { label: 'Offer Accepted', completed: false },
      { label: 'Escrow Funded', completed: false },
      { label: 'Due Diligence', completed: false },
      { label: 'Final Payment', completed: false },
      { label: 'Title Transfer', completed: false },
    ],
  },
];
