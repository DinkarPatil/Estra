import type { AreaRecommendation } from '@/mock-data/areas';

export interface IAreaService {
  searchAreas(query: string): Promise<AreaRecommendation[]>;
}
