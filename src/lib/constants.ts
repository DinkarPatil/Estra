import type { MockCredential } from '@/types/user';

export const APP_NAME = 'Estra Glimmora';
export const APP_DESCRIPTION = 'AGI-Powered Global Real Estate Intelligence Platform';

export const MOCK_CREDENTIALS: MockCredential[] = [
  {
    role: 'investor',
    email: 'investor@glimmora.com',
    password: 'investor123',
    name: 'Sarah Chen',
    description: 'Property investor with global portfolio',
  },
  {
    role: 'broker',
    email: 'broker@glimmora.com',
    password: 'broker123',
    name: 'James Okafor',
    description: 'Senior real estate broker',
  },
  {
    role: 'developer',
    email: 'developer@glimmora.com',
    password: 'developer123',
    name: 'Priya Sharma',
    description: 'Coming soon',
  },
  {
    role: 'admin',
    email: 'admin@glimmora.com',
    password: 'admin123',
    name: 'Alex Rivera',
    description: 'Coming soon',
  },
];

export const ROLE_LABELS: Record<string, string> = {
  investor: 'Investor',
  broker: 'Broker',
  developer: 'Developer',
  admin: 'Admin',
};

export const ROLE_COLORS: Record<string, string> = {
  investor: 'text-role-investor',
  broker: 'text-role-broker',
  developer: 'text-role-developer',
  admin: 'text-role-admin',
};

export const ROLE_BG_COLORS: Record<string, string> = {
  investor: 'bg-role-investor/10',
  broker: 'bg-role-broker/10',
  developer: 'bg-role-developer/10',
  admin: 'bg-role-admin/10',
};
