export type Currency = 'USD' | 'EUR' | 'GBP' | 'AED' | 'INR' | 'SGD' | 'JPY' | 'AUD';

export interface MoneyAmount {
  amount: number;
  currency: Currency;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  timestamp: string;
}

export interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

export interface DateRange {
  from: Date;
  to: Date;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export type Status = 'active' | 'inactive' | 'pending' | 'completed' | 'cancelled';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface TrendData {
  value: number;
  change: number;
  changePercent: number;
  direction: 'up' | 'down' | 'stable';
}

export interface ChartDataPoint {
  label: string;
  value: number;
  [key: string]: string | number;
}

export interface TimeSeriesPoint {
  date: string;
  value: number;
  [key: string]: string | number;
}
