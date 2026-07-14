export type UserRole = 'investor' | 'broker' | 'developer' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  tier?: 'standard' | 'hni' | 'uhni';
  company?: string;
  preferences?: UserPreferences;
  createdAt: string;
  lastLoginAt?: string;
}

export interface UserPreferences {
  currencies: string[];
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  preferredLocations: string[];
  investmentRange?: { min: number; max: number; currency: string };
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  theme: 'light' | 'dark' | 'system';
}

export interface MockCredential {
  role: UserRole;
  email: string;
  password: string;
  name: string;
  description: string;
}
