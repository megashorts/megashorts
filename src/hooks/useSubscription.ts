// subscription info check for subscription page button

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