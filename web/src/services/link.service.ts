import { ApiService } from './api.service';

export class LinkService extends ApiService {
  public list(params: LinkListParams = {}): Promise<PaginatedLinks> {
    return this.request<PaginatedLinks>(
      `/link${this.buildQuery(params as Record<string, string | number | boolean | undefined>)}`,
    );
  }

  public create(originalUrl: string): Promise<string> {
    return this.request<string>('/link', {
      method: 'POST',
      body: JSON.stringify({ originalUrl }),
    });
  }

  public getByCode(code: string): Promise<Link> {
    return this.request<Link>(`/link/${code}`);
  }

  public update(
    id: string,
    data: { originalUrl?: string; isArchived?: boolean; code?: string },
  ): Promise<Link> {
    return this.request<Link>(`/link/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  public delete(id: string): Promise<void> {
    return this.request<void>(`/link/${id}`, { method: 'DELETE' });
  }

  public async exportCsv(): Promise<Blob> {
    const res = await fetch(`${this.baseUrl}/link/export/csv`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to export CSV');
    return res.blob();
  }

  public qrUrl(code: string): string {
    return `${this.baseUrl}/link/${code}/qr`;
  }

  private buildQuery(params: Record<string, string | number | boolean | undefined>): string {
    const qs = Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== '')
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join('&');
    return qs ? `?${qs}` : '';
  }
}

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
