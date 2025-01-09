import { useQuery } from '@tanstack/react-query';
import kyInstance from '@/lib/ky';
import { NotificationCountInfo } from '@/lib/types';
import { useSession } from '@/components/SessionProvider';

// 읽지 않은 알림 개수만 가져오는 훅
export function useUnreadCount() {
  const { user } = useSession();
  
  return useQuery<NotificationCountInfo>({
    queryKey: ['notifications', 'unread'],
    queryFn: () => kyInstance.get('/api/notifications/unread-count').json(),
    enabled: !!user,  // 로그인한 경우에만 API 호출
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchInterval: 1000 * 30,
    refetchIntervalInBackground: false,
  });
}

// 알림 목록을 가져오는 훅 (Notifications 컴포넌트용)
export function useNotificationsList() {
  const { user } = useSession();
  
  return useQuery({
    queryKey: ['notifications'],
    queryFn: () => kyInstance.get('/api/notifications').json(),
    enabled: !!user,  // 로그인한 경우에만 API 호출
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchInterval: 1000 * 30,
    refetchIntervalInBackground: false,
  });
}


// refetchOnWindowFocus: true, // 탭 활성화될 때 체크
// refetchInBackground: false, // 백그라운드 호출 방지
// refetchOnMount: true, // 컴포넌트 마운트 시 체크
// refetchInterval: 1000 * 60, // 활성 탭에서 1분마다 체크 (선택적)
// refetchIntervalInBackground: false // 백그라운드에서는 주기적 호출 안 함