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
}

export interface DailyClick {
  date: string;
  value: number;
}
