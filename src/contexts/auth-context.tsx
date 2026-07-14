'use client';
import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { User, UserRole } from '@/types/user';
import { billingApi } from '@/lib/api';
import type { PlanId } from '@/lib/plans';
import { clearPlanCookie, clearSkipPlan, getSkipPlan, pruneLegacyClientPlanState, setPlanCookie } from '@/lib/payment/plan-storage';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  plan: PlanId | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  refreshPlan: () => Promise<PlanId | null>;
}

async function loadPlanForCurrentUser(): Promise<PlanId | null> {
  try {
    const res = await billingApi.getMyPlan();
    if (res.plan?.plan_id) return res.plan.plan_id as PlanId;
  } catch {
    /* fall through to skip override */
  }
  return getSkipPlan();
}

function applyPlanCookie(plan: PlanId | null): void {
  if (plan) setPlanCookie(plan);
  else clearPlanCookie();
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

const MOCK_USERS: (User & { password: string })[] = [
  {
    id: 'inv-001', email: 'investor@glimmora.com', password: 'investor123',
    name: 'Sarah Chen', role: 'investor', tier: 'uhni',
    preferences: { currencies: ['USD', 'EUR'], riskTolerance: 'moderate', preferredLocations: ['Dubai', 'Singapore'], notifications: { email: true, push: true, sms: false }, theme: 'light' },
    createdAt: '2024-01-15T08:00:00Z',
  },
  {
    id: 'brk-001', email: 'broker@glimmora.com', password: 'broker123',
    name: 'James Okafor', role: 'broker', company: 'Global Realty Partners',
    createdAt: '2024-02-10T08:00:00Z',
  },
  {
    id: 'dev-001', email: 'developer@glimmora.com', password: 'developer123',
    name: 'Priya Sharma', role: 'developer', company: 'Vertex Developments',
    createdAt: '2024-03-05T08:00:00Z',
  },
  {
    id: 'adm-001', email: 'admin@glimmora.com', password: 'admin123',
    name: 'Alex Rivera', role: 'admin',
    createdAt: '2024-01-01T08:00:00Z',
  },
];

const SESSION_KEY = 'glimmora-session';
const ACCESS_TOKEN_KEY = 'glimmora-access-token';
const REFRESH_TOKEN_KEY = 'glimmora-refresh-token';

interface BackendUser {
  id: string;
  email: string;
  name: string;
  country: string;
  role: string;
  is_active: string;
  created_at: string;
}

interface BackendTokenResponse {
  access_token: string;
  access_jti: string;
  refresh_token: string;
  token_type: string;
}

// Backend self-register only allows 'user' | 'broker'; admin is server-seeded.
// Frontend type uses 'investor' | 'broker' | 'developer' | 'admin'. Map 'user' ↔ 'investor'.
function backendRoleToUi(role: string): UserRole {
  if (role === 'user') return 'investor';
  if (role === 'broker' || role === 'developer' || role === 'admin') return role;
  return 'investor';
}

function adaptBackendUser(u: BackendUser): User {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: backendRoleToUi(u.role),
    createdAt: u.created_at,
  };
}

function persistSession(user: User) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  // Cookie for middleware role-gating
  document.cookie = `${SESSION_KEY}=${encodeURIComponent(JSON.stringify({ role: user.role }))}; path=/; max-age=86400`;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [plan, setPlan] = useState<PlanId | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    pruneLegacyClientPlanState();
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setUser(parsed);
        loadPlanForCurrentUser().then((p) => {
          setPlan(p);
          applyPlanCookie(p);
        });
      }
    } catch {}
    setIsLoading(false);
  }, []);

  const refreshPlan = useCallback(async (): Promise<PlanId | null> => {
    const planId = await loadPlanForCurrentUser();
    setPlan(planId);
    applyPlanCookie(planId);
    return planId;
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<User> => {
    const normalizedEmail = email.trim().toLowerCase();

    // 1) Try real backend
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, password }),
      });

      if (res.ok) {
        const tokens = (await res.json()) as BackendTokenResponse;
        localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access_token);
        localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);

        const meRes = await fetch(`${API_BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${tokens.access_token}` },
        });
        if (!meRes.ok) throw new Error('Failed to load user profile');
        const backendUser = (await meRes.json()) as BackendUser;
        const userData = adaptBackendUser(backendUser);
        persistSession(userData);
        setUser(userData);
        const planId = await loadPlanForCurrentUser();
        setPlan(planId);
        applyPlanCookie(planId);
        return userData;
      }

      // Bad creds (401) or domain error (400): fall through to mock fallback
      // so the demo Quick Access buttons keep working.
      if (res.status !== 401 && res.status !== 400 && res.status !== 404) {
        let detail = `Login failed (${res.status})`;
        try {
          const body = await res.json();
          if (body?.detail) detail = body.detail;
        } catch {}
        throw new Error(detail);
      }
    } catch (err) {
      // Network failure (backend not running) — allow mock fallback below
      const isNetworkError = err instanceof TypeError;
      if (!isNetworkError) {
        // Real error from backend (5xx, parse failure, etc) — surface it
        throw err;
      }
    }

    // 2) Mock fallback (demo Quick Access)
    const found = MOCK_USERS.find(u => u.email === normalizedEmail && u.password === password);
    if (!found) {
      throw new Error('Invalid email or password');
    }
    const { password: _pw, ...userData } = found;
    persistSession(userData);
    setUser(userData);
    return userData;
  }, []);

  const logout = useCallback(() => {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (accessToken) {
      // Best-effort: tell the backend to blocklist the jti. Don't await.
      fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      }).catch(() => {});
    }
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    document.cookie = `${SESSION_KEY}=; path=/; max-age=0`;
    clearPlanCookie();
    clearSkipPlan();
    setUser(null);
    setPlan(null);
    window.location.href = '/login';
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      role: user?.role ?? null,
      plan,
      isAuthenticated: !!user,
      isLoading,
      login,
      logout,
      refreshPlan,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
