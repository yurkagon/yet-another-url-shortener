'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { linkApi } from '@/lib/api';

export const LINKS_KEY = ['links'] as const;

export function useLinks() {
  return useQuery({
    queryKey: LINKS_KEY,
    queryFn: linkApi.list,
  });
}

export function useCreateLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (originalUrl: string) => linkApi.create(originalUrl),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: LINKS_KEY });
    },
  });
}
