import type { IPropertyService } from '../interfaces/property.interface';
import type { Property, PropertyFilter } from '@/types/property';
import type { PaginatedResponse } from '@/types/common';
import { mockProperties } from '@/mock-data/properties';

const delay = (ms: number = 500) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export class MockPropertyService implements IPropertyService {
  async searchProperties(
    query: string,
    filters?: PropertyFilter
  ): Promise<PaginatedResponse<Property>> {
    await delay(600);
    let results = [...mockProperties];

    if (query) {
      const q = query.toLowerCase();
      results = results.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.location.city.toLowerCase().includes(q) ||
          p.location.country.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }

    if (filters) {
      if (filters.type?.length)
        results = results.filter((p) => filters.type!.includes(p.type));
      if (filters.priceMin)
        results = results.filter((p) => p.price.amount >= filters.priceMin!);
      if (filters.priceMax)
        results = results.filter((p) => p.price.amount <= filters.priceMax!);
      if (filters.minYield)
        results = results.filter((p) => p.rentalYield >= filters.minYield!);
      if (filters.countries?.length)
        results = results.filter((p) =>
          filters.countries!.includes(p.location.countryCode)
        );
      if (filters.riskScore?.length)
        results = results.filter((p) =>
          filters.riskScore!.includes(p.riskScore)
        );
    }

    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 20;
    const total = results.length;

    return {
      data: results.slice((page - 1) * pageSize, page * pageSize),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async getPropertyById(id: string): Promise<Property> {
    await delay(400);
    const property = mockProperties.find((p) => p.id === id);
    if (!property) throw new Error('Property not found');
    return property;
  }

  async getRecommendations(limit = 4): Promise<Property[]> {
    await delay(500);
    return [...mockProperties]
      .sort((a, b) => b.aiScore - a.aiScore)
      .slice(0, limit);
  }

  async getFeaturedProperties(): Promise<Property[]> {
    await delay(400);
    return mockProperties.filter((p) => p.aiScore >= 85).slice(0, 6);
  }
}
