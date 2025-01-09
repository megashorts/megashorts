import { useEffect } from 'react';
import { useSession } from '@/components/SessionProvider';
import { videoDB } from '@/lib/indexedDB';

export function useVideoSync() {
  const { user } = useSession();

  useEffect(() => {
    // 로그인 상태가 변경될 때마다 실행
    if (user) {
      // 서버에서 시청 기록 가져오기
      fetch('/api/videos/sync')
        .then(res => res.json())
        .then(data => {
          if (data.watchedVideos && data.lastViews) {
            // IndexedDB 동기화
            videoDB.syncWithServer({
              watchedVideos: data.watchedVideos,
              lastViews: data.lastViews
            }).catch(console.error);
          }
        })
        .catch(console.error);
    } else {
      // 로그아웃 시 IndexedDB 초기화
      videoDB.clearAll().catch(console.error);
    }
  }, [user?.id]); // user.id가 변경될 때만 실행 (로그인/로그아웃 시)
}