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
  id: string;
  code: string;
  originalUrl: string;
  isArchived: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
  _count: { clicks: number };
}

export interface LinkListParams {
  search?: string;
  page?: number;
  limit?: number;
  sortOrder?: 'asc' | 'desc';
  status?: 'active' | 'archived' | 'all';
}

export interface PaginatedLinks {
  data: Link[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

function buildQuery(params: Record<string, string | number | boolean | undefined>): string {
  const qs = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
  return qs ? `?${qs}` : '';
}

export const linkApi = {
  list: (params: LinkListParams = {}) =>
    api<PaginatedLinks>(`/link${buildQuery(params as Record<string, string | number | boolean | undefined>)}`),

  create: (originalUrl: string) =>
    api<string>('/link', { method: 'POST', body: JSON.stringify({ originalUrl }) }),

  exportCsv: async (): Promise<Blob> => {
    const res = await fetch(`${BASE_URL}/link/export/csv`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to export CSV');
    return res.blob();
  },

  getByCode: (code: string) => api<Link>(`/link/${code}`),

  update: (id: string, data: { originalUrl?: string; isArchived?: boolean }) =>
    api<Link>(`/link/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  delete: (id: string) =>
    api(`/link/${id}`, { method: 'DELETE' }),

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
