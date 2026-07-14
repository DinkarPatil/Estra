import type { MoneyAmount } from '@/types/common';

export interface FractionalToken {
  id: string;
  propertyId: string;
  propertyTitle: string;
  location: string;
  image?: string;
  totalTokens: number;
  availableTokens: number;
  tokenPrice: MoneyAmount;
  minInvestment: MoneyAmount;
  expectedYield: number; // annual %
  propertyValue: MoneyAmount;
  funded: number; // %
  investors: number;
  lockupPeriod: string;
  aiScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  daysLeft?: number;
  isNew?: boolean;
  myTokens?: number;
  myValue?: MoneyAmount;
  propertyType: string;
  monthlyIncome?: MoneyAmount;
  appreciation?: number; // trailing 12m %
  distributionFrequency: string;
  spvName: string;
}

export const mockFractionalTokens: FractionalToken[] = [
  {
    id: 'tok-001', propertyId: 'prop-002',
    propertyTitle: 'Palm Jumeirah Villa', location: 'Dubai, UAE',
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=400&fit=crop&q=80',
    totalTokens: 10000, availableTokens: 3200,
    tokenPrice: { amount: 1500, currency: 'AED' },
    minInvestment: { amount: 7500, currency: 'AED' },
    expectedYield: 7.2, propertyValue: { amount: 15000000, currency: 'AED' },
    funded: 68, investors: 412, lockupPeriod: '24 months',
    aiScore: 94, riskLevel: 'low', daysLeft: 18, isNew: false,
    propertyType: 'Luxury Villa',
    monthlyIncome: { amount: 90000, currency: 'AED' },
    appreciation: 14.2,
    distributionFrequency: 'Monthly',
    spvName: 'GLIMMORA SPV Palm-01 Ltd',
  },
  {
    id: 'tok-002', propertyId: 'prop-004',
    propertyTitle: 'Mayfair Georgian Townhouse', location: 'London, UK',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=400&fit=crop&q=80',
    totalTokens: 20000, availableTokens: 12000,
    tokenPrice: { amount: 500, currency: 'GBP' },
    minInvestment: { amount: 2500, currency: 'GBP' },
    expectedYield: 5.8, propertyValue: { amount: 8750000, currency: 'GBP' },
    funded: 40, investors: 218, lockupPeriod: '36 months',
    aiScore: 87, riskLevel: 'low', daysLeft: 45, isNew: true,
    propertyType: 'Townhouse',
    monthlyIncome: { amount: 42300, currency: 'GBP' },
    appreciation: 8.6,
    distributionFrequency: 'Quarterly',
    spvName: 'GLIMMORA SPV Mayfair-02 Ltd',
  },
  {
    id: 'tok-003', propertyId: 'prop-006',
    propertyTitle: 'Bandra Sea-View Apartment', location: 'Mumbai, India',
    image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=400&fit=crop&q=80',
    totalTokens: 50000, availableTokens: 8500,
    tokenPrice: { amount: 2000, currency: 'INR' },
    minInvestment: { amount: 10000, currency: 'INR' },
    expectedYield: 6.5, propertyValue: { amount: 85000000, currency: 'INR' },
    funded: 83, investors: 891, lockupPeriod: '18 months',
    aiScore: 79, riskLevel: 'medium', daysLeft: 7, isNew: false,
    myTokens: 25, myValue: { amount: 50000, currency: 'INR' },
    propertyType: 'Apartment',
    monthlyIncome: { amount: 460000, currency: 'INR' },
    appreciation: 11.3,
    distributionFrequency: 'Monthly',
    spvName: 'GLIMMORA SPV Bandra-03 Ltd',
  },
  {
    id: 'tok-004', propertyId: 'prop-008',
    propertyTitle: 'Bondi Beach Coastal Villa', location: 'Sydney, Australia',
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=400&fit=crop&q=80',
    totalTokens: 8000, availableTokens: 5600,
    tokenPrice: { amount: 1000, currency: 'AUD' },
    minInvestment: { amount: 5000, currency: 'AUD' },
    expectedYield: 6.1, propertyValue: { amount: 5200000, currency: 'AUD' },
    funded: 30, investors: 89, lockupPeriod: '24 months',
    aiScore: 83, riskLevel: 'low', daysLeft: 62, isNew: true,
    propertyType: 'Coastal Villa',
    monthlyIncome: { amount: 26400, currency: 'AUD' },
    appreciation: 9.1,
    distributionFrequency: 'Monthly',
    spvName: 'GLIMMORA SPV Bondi-04 Ltd',
  },
  {
    id: 'tok-005', propertyId: 'prop-010',
    propertyTitle: 'Marina Bay Suites', location: 'Singapore',
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=400&fit=crop&q=80',
    totalTokens: 15000, availableTokens: 2100,
    tokenPrice: { amount: 800, currency: 'SGD' },
    minInvestment: { amount: 4000, currency: 'SGD' },
    expectedYield: 5.4, propertyValue: { amount: 9800000, currency: 'SGD' },
    funded: 86, investors: 634, lockupPeriod: '30 months',
    aiScore: 91, riskLevel: 'low', daysLeft: 12, isNew: false,
    propertyType: 'Luxury Penthouse',
    monthlyIncome: { amount: 44100, currency: 'SGD' },
    appreciation: 12.7,
    distributionFrequency: 'Monthly',
    spvName: 'GLIMMORA SPV Marina-05 Ltd',
  },
  {
    id: 'tok-006', propertyId: 'prop-012',
    propertyTitle: 'Manhattan Skyline Loft', location: 'New York, USA',
    image: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&h=400&fit=crop&q=80',
    totalTokens: 25000, availableTokens: 18000,
    tokenPrice: { amount: 350, currency: 'USD' },
    minInvestment: { amount: 1750, currency: 'USD' },
    expectedYield: 4.9, propertyValue: { amount: 7200000, currency: 'USD' },
    funded: 28, investors: 156, lockupPeriod: '36 months',
    aiScore: 76, riskLevel: 'medium', daysLeft: 90, isNew: true,
    propertyType: 'Loft',
    monthlyIncome: { amount: 29400, currency: 'USD' },
    appreciation: 6.8,
    distributionFrequency: 'Quarterly',
    spvName: 'GLIMMORA SPV NYC-06 LLC',
  },
];
