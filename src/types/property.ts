import { MoneyAmount, Coordinates, RiskLevel } from './common';

export interface Property {
  id: string;
  title: string;
  description: string;
  location: PropertyLocation;
  price: MoneyAmount;
  type: PropertyType;
  subType: string;
  bedrooms?: number;
  bathrooms?: number;
  area: { value: number; unit: 'sqft' | 'sqm' };
  yearBuilt: number;
  developer: string;
  aiScore: number;
  rentalYield: number;
  capitalAppreciation: number;
  riskScore: RiskLevel;
  images: string[];
  features: string[];
  status: PropertyStatus;
  isFractional?: boolean;
  isLuxury?: boolean;
  createdAt: string;
}

export type PropertyType = 'residential' | 'commercial' | 'industrial' | 'land' | 'mixed-use';
export type PropertyStatus = 'available' | 'under-offer' | 'sold' | 'off-market';

export interface PropertyLocation {
  address?: string;
  city: string;
  state?: string;
  country: string;
  countryCode: string;
  coordinates: Coordinates;
  neighborhood?: string;
}

export interface PropertyFilter {
  query?: string;
  priceMin?: number;
  priceMax?: number;
  currency?: string;
  type?: PropertyType[];
  bedrooms?: number[];
  minYield?: number;
  countries?: string[];
  riskScore?: RiskLevel[];
  status?: PropertyStatus[];
  sortBy?: 'price' | 'aiScore' | 'yield' | 'appreciation' | 'newest';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}
