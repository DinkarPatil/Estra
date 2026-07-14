import type { Property, PropertyFilter } from '@/types/property';
import type { PaginatedResponse } from '@/types/common';

export interface IPropertyService {
  searchProperties(
    query: string,
    filters?: PropertyFilter
  ): Promise<PaginatedResponse<Property>>;
  getPropertyById(id: string): Promise<Property>;
  getRecommendations(limit?: number): Promise<Property[]>;
  getFeaturedProperties(): Promise<Property[]>;
}
