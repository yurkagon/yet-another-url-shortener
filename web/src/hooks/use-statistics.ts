'use client';

import { useQuery } from '@tanstack/react-query';
import { statisticsService } from '@/services';

export function useBrowserStats(code: string) {
  return useQuery({
    queryKey: ['statistics', code, 'browser'],
    queryFn: () => statisticsService.browser(code),
    enabled: !!code,
  });
}

export function useCountryStats(code: string) {
  return useQuery({
    queryKey: ['statistics', code, 'country'],
    queryFn: () => statisticsService.country(code),
    enabled: !!code,
  });
}

export function useTimelineStats(code: string) {
  return useQuery({
    queryKey: ['statistics', code, 'timeline'],
    queryFn: () => statisticsService.timeline(code),
    enabled: !!code,
  });
}
