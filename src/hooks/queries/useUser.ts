import { useQuery } from '@tanstack/react-query';
import kyInstance from '@/lib/ky';
import { UserData } from '@/lib/types';
import { useSession } from '@/components/SessionProvider';

export function useUser() {
  const session = useSession();
  const username = session.user?.username;

  return useQuery({
    queryKey: ['user', username],
    queryFn: async () => {
      if (!username) {
        return null;
      }
      return kyInstance.get(`/api/users/username/${username}`).json<UserData>();
    },
    enabled: !!username,  // username이 있을 때만 쿼리 실행
    staleTime: 1000 * 60 * 5, // 5분
  });
}