import { apiFetch } from './client';

export type BackendRole = 'user' | 'broker' | 'admin' | 'superadmin';

export interface BackendUser {
  id: string;
  email: string;
  name: string;
  country: string;
  role: BackendRole;
  is_active: string;
  created_at: string;
}

export interface TokenBundle {
  access_token: string;
  access_jti: string;
  refresh_token: string;
  token_type: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  country: string;
  password: string;
  role: BackendRole;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export function register(payload: RegisterPayload) {
  return apiFetch<BackendUser>('/auth/register', {
    method: 'POST',
    body: payload,
  });
}

export function login(payload: LoginPayload) {
  return apiFetch<TokenBundle>('/auth/login', {
    method: 'POST',
    body: payload,
  });
}

export function me() {
  return apiFetch<BackendUser>('/auth/me', { auth: true });
}

export function logout() {
  return apiFetch<{ message: string }>('/auth/logout', {
    method: 'POST',
    auth: true,
  });
}
