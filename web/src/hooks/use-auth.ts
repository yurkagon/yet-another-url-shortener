'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';

export const ME_KEY = ['auth', 'me'] as const;

export function useMe() {
  return useQuery({
    queryKey: ME_KEY,
    queryFn: authApi.me,
    retry: false,
    staleTime: 1000 * 60 * 5,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      queryClient.setQueryData(ME_KEY, data.user);
      router.push('/dashboard');
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: authApi.register,
    onSuccess: (data) => {
      queryClient.setQueryData(ME_KEY, data.user);
      router.push('/dashboard');
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      queryClient.clear();
      router.push('/login');
    },
  });
}
