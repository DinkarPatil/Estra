import { ApiError } from './errors';
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from '@/lib/auth/tokens';

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:8000');

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  auth?: boolean;
  headers?: Record<string, string>;
}

interface InternalOptions extends RequestOptions {
  _retried?: boolean;
}

async function parseError(res: Response): Promise<ApiError> {
  const text = await res.text();
  let detail = text || res.statusText;
  try {
    const json = JSON.parse(text);
    if (typeof json?.detail === 'string') detail = json.detail;
    else if (json?.detail) detail = JSON.stringify(json.detail);
  } catch {
    /* body wasn't JSON — use raw text */
  }
  return new ApiError(res.status, detail);
}

async function tryRefresh(): Promise<boolean> {
  const refresh = getRefreshToken();
  if (!refresh) return false;
  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refresh }),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as {
      access_token: string;
      refresh_token: string;
    };
    setTokens({
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
    });
    return true;
  } catch {
    return false;
  }
}

export async function apiFetch<T = unknown>(
  path: string,
  options: InternalOptions = {},
): Promise<T> {
  const { method = 'GET', body, auth = false, headers = {}, _retried } = options;

  const finalHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };
  if (auth) {
    const token = getAccessToken();
    if (token) finalHeaders.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: finalHeaders,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (res.status === 401 && auth && !_retried) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      return apiFetch<T>(path, { ...options, _retried: true });
    }
    clearTokens();
    throw await parseError(res);
  }

  if (!res.ok) {
    throw await parseError(res);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
