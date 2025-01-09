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
    // staleTime: 1000 * 60 * 60 * 12, // 12시간 캐시
    // refetchOnWindowFocus: false,     // 탭 활성화시 갱신 안함
    staleTime: 0,  // 캐시 없이 매번 새로운 데이터
    gcTime: 0,  // 캐시 저장하지 않음
    refetchOnMount: true,  // 마운트마다 갱신
    refetchOnWindowFocus: true,  // 포커스마다 갱신
    refetchOnReconnect: true,  // 재연결마다 갱신
  });
}