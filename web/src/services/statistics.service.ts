import { ApiService } from './api.service';

export class StatisticsService extends ApiService {
  public browser(code: string): Promise<Record<string, number>> {
    return this.request<Record<string, number>>(`/statistics/link/${code}/browser`);
  }

  public country(code: string): Promise<Record<string, number>> {
    return this.request<Record<string, number>>(`/statistics/link/${code}/country`);
  }

  public timeline(code: string): Promise<DailyClick[]> {
    return this.request<DailyClick[]>(`/statistics/link/${code}/timeline`);
  }

  // ── Aggregates across all of the user's links ──────────────────────────────

  public myOverview(): Promise<MyOverview> {
    return this.request<MyOverview>('/statistics/me/overview');
  }

  public myTimeline(): Promise<DailyClick[]> {
    return this.request<DailyClick[]>('/statistics/me/timeline');
  }

  public myCountry(): Promise<Record<string, number>> {
    return this.request<Record<string, number>>('/statistics/me/country');
  }

  public myBrowser(): Promise<Record<string, number>> {
    return this.request<Record<string, number>>('/statistics/me/browser');
  }

  public myTopLinks(): Promise<TopLink[]> {
    return this.request<TopLink[]>('/statistics/me/top-links');
  }
}

export interface DailyClick {
  date: string;
  value: number;
}

export interface MyOverview {
  totalLinks: number;
  activeLinks: number;
  archivedLinks: number;
  totalClicks: number;
  clicksLast7Days: number;
  avgClicksPerLink: number;
}

export interface TopLink {
  id: string;
  code: string;
  originalUrl: string;
  clicks: number;
}
