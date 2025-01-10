'use client';

import { cn } from "../../lib/utils";
import { Video, VideoView } from "@prisma/client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { videoDB } from "../../lib/indexedDB";

interface VideoButtonsProps {
  videos: (Video & {
    views: VideoView[];
  })[];
  userId?: string;
  postId: string;
  onVideoSelect: (sequence: number) => void;
}

export default function VideoButtons({ videos, userId, postId, onVideoSelect }: VideoButtonsProps) {
  const sortedVideos = [...videos].sort((a, b) => a.sequence - b.sequence);
  const [watchedVideos, setWatchedVideos] = useState<Set<string>>(new Set());

  // 시청 기록 확인
  const checkWatchHistory = async () => {
    try {
      await videoDB.init();
      const transaction = videoDB['db']!.transaction(['watchedVideos'], 'readonly');
      const store = transaction.objectStore('watchedVideos');
      const request = store.getAll();

      request.onsuccess = () => {
        const records = request.result || [];
        const watchedSet = new Set(records.map(record => record.videoId));
        setWatchedVideos(watchedSet);
      };

      request.onerror = () => {
        console.error('Failed to read watch history');
      };

      transaction.onerror = () => {
        console.error('Transaction error');
      };
    } catch (error) {
      console.error('Failed to check watch history:', error);
    }
  };

  useEffect(() => {
    let mounted = true;

    const loadWatchHistory = async () => {
      if (mounted) {
        await checkWatchHistory();
      }
    };

    loadWatchHistory();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && mounted) {
        loadWatchHistory();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      mounted = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <div className="w-full">
      <div className="grid grid-cols-8 sm:grid-cols-10 md:grid-cols-14 lg:grid-cols-20 gap-2">
        {sortedVideos.map((video) => {
          const isWatched = watchedVideos.has(video.id);
          const isPremium = video.isPremium;

          return (
            <Link
              key={video.id}
              href={`/video-view/${postId}?sequence=${video.sequence}`}
              className="block"
            >
              <button
                onClick={() => onVideoSelect(video.sequence)}
                className={cn(
                  "relative w-full aspect-square rounded text-xs font-medium transition-colors",
                  isWatched
                    ? "opacity-50 bg-gray-300 hover:bg-gray-400"  // 시청한 컨텐츠는 더 흐리게
                    : isPremium
                      ? "bg-primary/90 hover:bg-primary/100"
                      : "border-2 border-red-500 bg-white hover:bg-gray-100 text-black",
                  "flex items-center justify-center"
                )}
              >
                <span>{video.sequence}</span>
              </button>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
