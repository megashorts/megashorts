import { useQuery } from '@tanstack/react-query';
import kyInstance from '@/lib/ky';

interface UserAuthData {
  adultauth: boolean;
  subscriptionEndDate: Date | null;
}

export function useUserAuth(userId: string | undefined) {
  return useQuery<UserAuthData>({
    queryKey: ['userAuth', userId],
    queryFn: () => kyInstance.get(`/api/users/${userId}/auth`).json(),
    enabled: !!userId,
    staleTime: 1000 * 60 * 60 * 12, // 12시간 동안 캐시 사용
    refetchOnMount: false,           // 불필요한 API 호출 방지
    refetchOnWindowFocus: false,     // 불필요한 API 호출 방지
    refetchOnReconnect: false        // 불필요한 API 호출 방지
  });
}