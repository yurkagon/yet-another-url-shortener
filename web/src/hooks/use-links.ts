'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { linkApi, type LinkListParams } from '@/lib/api';

export const LINKS_KEY = ['links'] as const;

export function useLinks(params: LinkListParams = {}) {
  return useQuery({
    queryKey: [...LINKS_KEY, params],
    queryFn: () => linkApi.list(params),
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

export function useUpdateLink(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { originalUrl?: string; isArchived?: boolean }) =>
      linkApi.update(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: LINKS_KEY });
    },
  });
}

export function useDeleteLink(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => linkApi.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: LINKS_KEY });
    },
  });
}
