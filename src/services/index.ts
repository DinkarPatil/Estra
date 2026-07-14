import type { IPropertyService } from './interfaces/property.interface';
import type { IAuthService } from './interfaces/auth.interface';
import type { IAreaService } from './interfaces/area.interface';
import type { IBrokerService } from './interfaces/broker.interface';
import { MockPropertyService } from './mock/property.mock';
import { MockAreaService } from './mock/area.mock';
import { MockBrokerService } from './mock/broker.mock';
import { ApiAreaService } from './api/area.api';
import { ApiPropertyService } from './api/property.api';
import { ApiBrokerService } from './api/broker.api';

// Default to the real backend now that broker listings + area-first search are
// wired through the FastAPI server. Set NEXT_PUBLIC_USE_MOCK_DATA=true to opt in
// to the in-memory mocks (useful for offline UI work).
const useMock = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';

// Property service — mock by default; wired to backend when USE_MOCK_DATA=false
export const propertyService: IPropertyService = useMock
  ? new MockPropertyService()
  : new ApiPropertyService();

// Area service — wired to /orchestrator/areas when USE_MOCK_DATA=false
export const areaService: IAreaService = useMock
  ? new MockAreaService()
  : new ApiAreaService();

// Broker service — wired to /broker/* when USE_MOCK_DATA=false
export const brokerService: IBrokerService = useMock
  ? new MockBrokerService()
  : new ApiBrokerService();

// Backend-native service instances (for direct backend API access even in mock mode)
export const apiPropertyService = new ApiPropertyService();
export const apiBrokerService = new ApiBrokerService();

export type { IPropertyService, IAuthService, IAreaService, IBrokerService };
