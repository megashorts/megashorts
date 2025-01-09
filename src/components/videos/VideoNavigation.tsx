'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';

interface VideoNavigationProps {
  hasNextVideo: boolean;
  hasPrevVideo: boolean;
  onNavigate: (direction: 'next' | 'prev') => void;
}

export default function VideoNavigation({
  hasNextVideo,
  hasPrevVideo,
  onNavigate,
}: VideoNavigationProps) {
  useEffect(() => {
    let touchStartY = 0;

    const handleNavigation = (direction: 'next' | 'prev') => {
      const isNext = direction === 'next';
      const hasVideo = isNext ? hasNextVideo : hasPrevVideo;
      const message = isNext ? "마지막 영상입니다." : "첫 번째 영상입니다.";

      if (!hasVideo) {
        toast(message);
        return;
      }

      onNavigate(direction);
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.deltaY > 50) {
        handleNavigation('next');
      } else if (e.deltaY < -50) {
        handleNavigation('prev');
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const touchEndY = e.changedTouches[0].clientY;
      const deltaY = touchEndY - touchStartY;

      if (deltaY < -50) {
        handleNavigation('next');
      } else if (deltaY > 50) {
        handleNavigation('prev');
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [hasNextVideo, hasPrevVideo, onNavigate]);

  return null;
}