import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface VideoProgress {
  postId: string;
  videoId: string;
  videoIndex: number;
  timestamp: number;
}

interface VideoStore {
  videoProgress: Record<string, VideoProgress>;
  setVideoProgress: (
    postId: string,
    videoId: string,
    videoIndex: number,
    timestamp: number
  ) => void;
  getVideoProgress: (postId: string) => Promise<VideoProgress | null>;
}

export const useVideoStore = create<VideoStore>()(
  persist(
    (set, get) => ({
      videoProgress: {},
      
      setVideoProgress: (postId, videoId, videoIndex, timestamp) => {
        set((state) => ({
          videoProgress: {
            ...state.videoProgress,
            [postId]: {
              postId,
              videoId,
              videoIndex,
              timestamp,
            },
          },
        }));

        // 서버와 동기화
        fetch('/api/videos/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            videoId,
            timestamp,
          }),
        }).catch(console.error);
      },

      getVideoProgress: async (postId) => {
        const state = get();
        const localProgress = state.videoProgress[postId];
        
        // 로컬에 저장된 진행 상태가 없으면 서버 요청 스킵
        if (!localProgress?.videoId) {
          return null;
        }
        
        try {
          const response = await fetch(`/api/videos/progress?videoId=${localProgress.videoId}`);
          const serverProgress = await response.json();
          
          if (serverProgress && serverProgress.lastTimestamp > (localProgress?.timestamp || 0)) {
            return {
              ...localProgress,
              timestamp: serverProgress.lastTimestamp,
            };
          }
        } catch (error) {
          console.error('Failed to fetch server progress:', error);
        }
        
        return localProgress || null;
      },
    }),
    {
      name: 'video-store',
    }
  )
);