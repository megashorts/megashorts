import { useQuery } from '@tanstack/react-query';
import kyInstance from '@/lib/ky';
import { useSession } from '@/components/SessionProvider';

interface SubscriptionInfo {
  isActive: boolean;
  subscription: 'weekly' | 'yearly' | null;
}

export function useSubscription() {
  const { user } = useSession();

  return useQuery<SubscriptionInfo>({
    queryKey: ['subscription-info'],
    queryFn: () => kyInstance.get('/api/subscription/status').json(),
    enabled: !!user?.id,
    staleTime: 12 * 60 * 60 * 1000, // 12시간
  });
}

// import { useQuery } from '@tanstack/react-query';
// import kyInstance from '@/lib/ky';

// interface SubscriptionInfo {
//   subscription: 'weekly' | 'yearly' | null;
//   subscriptionEndDate: string | null;
//   isActive: boolean;
// }

// export function useSubscription(id: string) {  // userId 파라미터 제거
//   return useQuery({
//     queryKey: ['subscription-info'],
//     queryFn: () => kyInstance.get('/api/subscription/status').json<SubscriptionInfo>(),
//     staleTime: 5 * 60 * 1000,
//   });
// }