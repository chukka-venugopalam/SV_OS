'use client';

import { useQuery } from '@tanstack/react-query';

import { getPlatformStatus } from '@/lib/platform-client';
import { usePlatformStore } from '@/stores/platform-store';

export function usePlatformStatus() {
  const setPlatformState = usePlatformStore((state) => state.setPlatformState);

  return useQuery({
    queryKey: ['platform-status'],
    queryFn: async () => {
      const response = await getPlatformStatus();
      setPlatformState({
        initialized: response.data?.initialized ?? false,
        environment: response.data?.environment ?? 'development',
        features: response.data?.features ?? {},
        engines: response.data?.engines ?? [],
        capabilities: response.data?.capabilities ?? [],
        plugins: response.data?.plugins ?? [],
      });
      return response;
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}
