'use client';

import { useState, useCallback, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { AccessMethod, Language, User } from "@prisma/client";
import { VideoPermissionCheck } from "@/components/videos/VideoPermissionCheck";
import { videoTracking } from "@/lib/videoTracking";
import VideoControls from "@/components/videos/VideoControls";

interface PostForClient {
  id: string;
  ageLimit: number;
  videos: {
    id: string;
    url: string;
    isPremium: boolean;
    sequence: number;
    subtitle: Language[];
  }[];
}

interface WatchPageClientProps {
  video: {
    id: string;
    url: string;
    isPremium: boolean;
    sequence: number;
    subtitle: Language[];
  };
  postId: string;
  postTitle: string;
  postContent: string;
  isBookmarked: boolean;
  isLiked: boolean;
  likeCount: number;
  showControls: boolean;
  hasNextVideo: boolean;
  hasPrevVideo: boolean;
  nextVideoId?: string;
  prevVideoId?: string;
  totalVideos: number;
  post: PostForClient;
  user: User | null;
}

export default function WatchPageClient({
  video,
  post,
  user,
  postId,
  postTitle,
  postContent,
  isBookmarked,
  isLiked,
  likeCount,
  showControls,
  hasNextVideo: initialHasNext,
  hasPrevVideo: initialHasPrev,
  nextVideoId: initialNextId,
  prevVideoId: initialPrevId,
  totalVideos,
}: WatchPageClientProps) {
  const [showButtons, setShowButtons] = useState(true);
  const [currentVideo, setCurrentVideo] = useState(video);
  const [currentSequence, setCurrentSequence] = useState(video.sequence);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const isTransitioning = useRef(false);
  const lastTimeUpdateRef = useRef(0);
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);
  const scrollTimeout = useRef<NodeJS.Timeout>();
  

  const handleTimeUpdate = useCallback((currentTime: number) => {
    const now = Date.now();
    
    const isFirstThreeSeconds = !lastTimeUpdateRef.current;
    
    if (isFirstThreeSeconds) {
      if (currentTime >= 3) {
        lastTimeUpdateRef.current = now;
        
        let accessMethod: AccessMethod = 'FREE';
        if (currentVideo.isPremium) {
          if (user?.subscriptionEndDate && new Date(user.subscriptionEndDate) > new Date()) {
            accessMethod = 'SUBSCRIPTION';
          } else {
            accessMethod = 'POINT_PAYMENT';
          }
        }
  
        if (user) {
          videoTracking.trackView({
            userId: user.id,
            videoId: currentVideo.id,
            postId,
            sequence: currentSequence,
            timestamp: currentTime,
            duration: currentTime,
            accessMethod
          });
        }
      }
    } else {
      const lastUpdateTime = Math.floor(currentTime / 10) * 10;
      if (lastUpdateTime > Math.floor((currentTime - 10) / 10) * 10 && user) {
        videoTracking.trackView({
          userId: user.id,
          videoId: currentVideo.id,
          postId,
          sequence: currentSequence,
          timestamp: lastUpdateTime,
          duration: lastUpdateTime - Math.floor((currentTime - 10) / 10) * 10,
          accessMethod: user.subscriptionEndDate && new Date(user.subscriptionEndDate) > new Date()
            ? 'SUBSCRIPTION'
            : 'FREE'
        });
      }
    }
  }, [currentVideo.id, currentVideo.isPremium, postId, currentSequence, user]);

  const updateButtonsVisibility = useCallback(() => {
    setShowButtons(true);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setShowButtons(false);
    }, 3000);
  }, []);

  const showScrollDirection = useCallback((direction: 'next' | 'prev') => {
    setShowScrollIndicator(true);
    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current);
    }
    scrollTimeout.current = setTimeout(() => {
      setShowScrollIndicator(false);
    }, 500);
  }, []);

  const handleNavigation = useCallback(async (direction: 'next' | 'prev') => {
    if (isTransitioning.current) return;
      
    const isNext = direction === 'next';
    const newSequence = currentSequence + (isNext ? 1 : -1);
  
    if (newSequence < 1 || newSequence > totalVideos) {
      toast({
        description: isNext ? "마지막 영상입니다." : "첫 번째 영상입니다.",
      });
      return;
    }
  
    isTransitioning.current = true;
    showScrollDirection(direction);
  
    try {
      // 다음 비디오 데이터 미리 가져오기
      const prefetchResponse = await fetch(`/api/videos/${postId}?sequence=${newSequence}`);
      if (!prefetchResponse.ok) {
        throw new Error('Failed to fetch video');
      }
  
      const data = await prefetchResponse.json();
  
      // URL 업데이트
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('sequence', String(newSequence));
      window.history.pushState({}, '', newUrl.toString());
  
      // 상태 업데이트를 한번에 처리
      Promise.resolve().then(() => {
        setCurrentVideo(data);
        setCurrentSequence(newSequence);
      });
  
    } catch (error) {
      console.error('Error during navigation:', error);
      toast({
        description: "영상을 불러오는데 실패했습니다.",
      });
    }
  
    setTimeout(() => {
      isTransitioning.current = false;
    }, 150);
  }, [currentSequence, totalVideos, postId]);

  useEffect(() => {
    let touchStartY = 0;
    let scrolling = false;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      
      if (scrolling) return;
      scrolling = true;

      if (Math.abs(e.deltaY) > 30) {
        handleNavigation(e.deltaY > 0 ? 'next' : 'prev');
      }

      setTimeout(() => {
        scrolling = false;
      }, 100);
    };

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (scrolling) return;
      scrolling = true;

      const deltaY = e.changedTouches[0].clientY - touchStartY;
      if (Math.abs(deltaY) > 30) {
        handleNavigation(deltaY < 0 ? 'next' : 'prev');
      }

      setTimeout(() => {
        scrolling = false;
      }, 100);
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleNavigation]);

  // 비디오 종료 핸들러 추가 (자동재생 수정)
  const handleVideoEnd = useCallback(() => {
    if (currentSequence < totalVideos) {
      handleNavigation('next').catch(console.error);
    }
  }, [currentSequence, totalVideos, handleNavigation]);

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
    {/* 상단 오버레이 추가 */}
    <div className={cn(
      "absolute inset-x-0 top-0 h-16 bg-black transition-opacity duration-300",
      showButtons ? "opacity-100" : "opacity-0"
    )} />
    {/* 하단 오버레이 추가 */}
    <div className={cn(
      "absolute inset-x-0 bottom-0 h-16 bg-black transition-opacity duration-300",
      showButtons ? "opacity-100" : "opacity-0"
    )} />

    <div 
      className="relative h-full flex items-center justify-center"
      onMouseMove={updateButtonsVisibility}
      onTouchStart={updateButtonsVisibility}
    >
      <div 
        className="w-full h-full flex items-center justify-center px-4 pt-16 pb-16"
        onClick={updateButtonsVisibility}
      >
        <div className="relative w-[calc(100vh*16/9)] max-w-[640px] h-full bg-black">  {/* bg-black 추가 */}
          {/* <VideoPermissionCheck
            post={post}
            currentVideo={currentVideo}
            user={user}
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleVideoEnd}
            showControls={showControls}
            className="w-auto h-full object-contain"
          /> */}

            {showScrollIndicator && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="bg-black/30 rounded-full p-8 backdrop-blur-lg">
                  {currentSequence > 1 && (
                    <ChevronLeft className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 text-white/70" />
                  )}
                  {currentSequence < totalVideos && (
                    <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 text-white/70" />
                  )}
                </div>
              </div>
            )}

            {showControls && (
              <div className={cn(
                "absolute right-4 bottom-20 md:right-[-5.5rem] md:bottom-30 z-10 transition-opacity duration-300",
                showButtons ? "opacity-100" : "opacity-0"
              )}
              onMouseMove={updateButtonsVisibility}
              onTouchStart={updateButtonsVisibility}
              >
                <VideoControls
                  postId={postId}
                  initialBookmarkState={{
                    isBookmarkedByUser: isBookmarked
                  }}
                  initialLikeState={{
                    likes: likeCount,
                    isLikedByUser: isLiked
                  }}
                  hasNextVideo={currentSequence < totalVideos}
                  hasPrevVideo={currentSequence > 1}
                  onNavigate={handleNavigation}
                  visible={showButtons}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}