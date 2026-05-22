const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/v1';

async function api<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  const { headers: initHeaders, ...restInit } = init ?? {};

  const res = await fetch(`${BASE_URL}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(initHeaders ?? {}),
    },
    ...restInit,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, (body as { message?: string }).message ?? res.statusText, body);
  }

  if (res.status === 204) return undefined as T;

  const contentType = res.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return res.json() as Promise<T>;
  }
  return res.text() as unknown as T;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export const authApi = {
  register: (data: { name: string; email: string; password: string }) =>
    api<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),

  login: (data: { email: string; password: string }) =>
    api<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),

  logout: () => api('/auth/logout', { method: 'POST' }),

  me: () => api<User>('/auth/me'),
};

// ─── Links ───────────────────────────────────────────────────────────────────

export interface Link {
  code: string;
  originalUrl: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export const linkApi = {
  list: () => api<Link[]>('/link'),

  create: (originalUrl: string) =>
    api<string>('/link', { method: 'POST', body: JSON.stringify({ originalUrl }) }),

  qrUrl: (code: string) => `${BASE_URL}/link/${code}/qr`,
};

// ─── Statistics ──────────────────────────────────────────────────────────────

export interface DailyClick {
  date: string;
  value: number;
}

export const statisticsApi = {
  browser: (code: string) => api<Record<string, number>>(`/statistics/link/${code}/browser`),
  country: (code: string) => api<Record<string, number>>(`/statistics/link/${code}/country`),
  timeline: (code: string) => api<DailyClick[]>(`/statistics/link/${code}/timeline`),
};
