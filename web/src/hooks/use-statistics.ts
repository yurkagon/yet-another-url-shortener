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

// ── Aggregates across all of the user's links ────────────────────────────────

export function useMyOverview() {
  return useQuery({
    queryKey: ['statistics', 'me', 'overview'],
    queryFn: () => statisticsService.myOverview(),
  });
}

export function useMyTimeline() {
  return useQuery({
    queryKey: ['statistics', 'me', 'timeline'],
    queryFn: () => statisticsService.myTimeline(),
  });
}

export function useMyCountryStats() {
  return useQuery({
    queryKey: ['statistics', 'me', 'country'],
    queryFn: () => statisticsService.myCountry(),
  });
}

export function useMyBrowserStats() {
  return useQuery({
    queryKey: ['statistics', 'me', 'browser'],
    queryFn: () => statisticsService.myBrowser(),
  });
}

export function useMyTopLinks() {
  return useQuery({
    queryKey: ['statistics', 'me', 'top-links'],
    queryFn: () => statisticsService.myTopLinks(),
  });
}
