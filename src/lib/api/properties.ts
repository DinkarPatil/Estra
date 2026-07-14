import type { Property, PropertyType, PropertyStatus } from '@/types/property';
import type { RiskLevel } from '@/types/common';
import { apiFetch } from './client';

export interface ListPropertiesParams {
  city?: string;
  country?: string;
  countryCode?: string;
  type?: PropertyType;
  status?: PropertyStatus;
  riskScore?: RiskLevel;
  minPrice?: number;
  maxPrice?: number;
  minYield?: number;
  limit?: number;
  offset?: number;
}

export interface PropertyListResult {
  items: Property[];
  total: number;
  limit: number;
  offset: number;
}

function buildQuery(params: ListPropertiesParams): string {
  const map: Record<string, string | undefined> = {
    city: params.city,
    country: params.country,
    country_code: params.countryCode,
    type: params.type,
    status: params.status,
    risk_score: params.riskScore,
    min_price: params.minPrice?.toString(),
    max_price: params.maxPrice?.toString(),
    min_yield: params.minYield?.toString(),
    limit: params.limit?.toString(),
    offset: params.offset?.toString(),
  };
  const search = new URLSearchParams();
  for (const [k, v] of Object.entries(map)) {
    if (v !== undefined && v !== '') search.set(k, v);
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export function listProperties(
  params: ListPropertiesParams = {},
): Promise<PropertyListResult> {
  return apiFetch<PropertyListResult>(`/properties${buildQuery(params)}`);
}

export function getProperty(id: string): Promise<Property> {
  return apiFetch<Property>(`/properties/${encodeURIComponent(id)}`);
}
