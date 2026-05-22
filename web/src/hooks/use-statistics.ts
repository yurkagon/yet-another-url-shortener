'use client';

import { useQuery } from '@tanstack/react-query';
import { statisticsApi } from '@/lib/api';

export function useBrowserStats(code: string) {
  return useQuery({
    queryKey: ['statistics', code, 'browser'],
    queryFn: () => statisticsApi.browser(code),
    enabled: !!code,
  });
}

export function useCountryStats(code: string) {
  return useQuery({
    queryKey: ['statistics', code, 'country'],
    queryFn: () => statisticsApi.country(code),
    enabled: !!code,
  });
}

export function useTimelineStats(code: string) {
  return useQuery({
    queryKey: ['statistics', code, 'timeline'],
    queryFn: () => statisticsApi.timeline(code),
    enabled: !!code,
  });
}
