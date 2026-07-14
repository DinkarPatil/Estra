import { mockAreas, type AreaRecommendation } from '@/mock-data/areas';
import type { IAreaService } from '../interfaces/area.interface';

export class MockAreaService implements IAreaService {
  async searchAreas(_query: string): Promise<AreaRecommendation[]> {
    return mockAreas;
  }
}
