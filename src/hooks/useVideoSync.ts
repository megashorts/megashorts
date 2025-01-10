import { useEffect } from 'react';
import { useSession } from '../components/SessionProvider';
import { videoDB } from '../lib/indexedDB';

export function useVideoSync() {
  const { user } = useSession();

  useEffect(() => {
    // 로그인 상태일 때만 서버와 동기화
    if (user) {
      fetch('/api/videos/sync')
        .then(res => res.json())
        .then(data => {
          if (data.watchedVideos && data.lastViews) {
            videoDB.syncWithServer({
              watchedVideos: data.watchedVideos,
              lastViews: data.lastViews
            }).catch(error => {
              console.error('Failed to sync with server:', error);
            });
          }
        })
        .catch(error => {
          console.error('Failed to fetch sync data:', error);
        });
    }
  }, [user?.id]); // user.id가 변경될 때만 실행
}
