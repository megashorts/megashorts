// src/hooks/queries/useUserAuth.ts

import { useQuery } from '@tanstack/react-query';
import kyInstance from '@/lib/ky';

interface UserAuthData {
  adultauth: boolean;
  referredBy: string | null;
  teamMaster: boolean;
  mscoin: number;
  purchasedVideoIds: string[];
  subscription: {
    currentPeriodEnd: Date | null;
  } | null;
}

export function useUserAuth(userId: string | undefined) {
  return useQuery<UserAuthData>({
    queryKey: ['userAuth', userId],
    queryFn: () => kyInstance.get(`/api/users/${userId}/auth`).json(),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5분 동안 캐시 사용
    refetchOnMount: true,    // 마운트 시 리페치 허용하여 최신 정보 동기화
    refetchOnWindowFocus: false,     // 불필요한 API 호출 방지
    refetchOnReconnect: false        // 불필요한 API 호출 방지
  });
}