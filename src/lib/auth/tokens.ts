const ACCESS_KEY = 'glimmora-access-token';
const REFRESH_KEY = 'glimmora-refresh-token';
const SESSION_COOKIE = 'glimmora-session';
const SESSION_MAX_AGE = 60 * 60 * 24;

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(REFRESH_KEY);
}

export function setTokens(params: { accessToken: string; refreshToken: string }): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(ACCESS_KEY, params.accessToken);
  window.localStorage.setItem(REFRESH_KEY, params.refreshToken);
}

export function clearTokens(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(ACCESS_KEY);
  window.localStorage.removeItem(REFRESH_KEY);
}

export function setSessionCookie(role: string): void {
  if (typeof document === 'undefined') return;
  const value = encodeURIComponent(JSON.stringify({ role }));
  document.cookie = `${SESSION_COOKIE}=${value}; path=/; max-age=${SESSION_MAX_AGE}; samesite=lax`;
}

export function clearSessionCookie(): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0; samesite=lax`;
}
