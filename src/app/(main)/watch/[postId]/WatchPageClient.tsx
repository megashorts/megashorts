'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import VideoPlayer from '@/components/videos/VideoPlayer';
import { AlertModal } from '@/components/ui/AlertModal';
import PlayPermissionCheck from '@/components/videos/PlayPermissionCheck';
import { cn } from '@/lib/utils';
import VideoControls from '@/components/videos/VideoControls';
import { useRouter } from 'next/navigation';
import { User } from '@prisma/client';
import { useSearchParams } from 'next/navigation';
import { videoDB } from '@/lib/indexedDB';

interface ModalState {
  isOpen: boolean;
  message: string;
  imageUrl: string;
  redirectUrl?: string;
  buttonText?: string;
}

interface WatchPageClientProps {
  video: {
    id: string;
    url: string;
    sequence: number;
    isPremium: boolean;
  };
  post: {
    id: string;
    ageLimit: number;
    title: string | null;
    videos: {
      id: string;
      url: string;
      sequence: number;
      isPremium: boolean;
    }[];
  };
  user: User | null;
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
}

export default function WatchPageClient({
  video,
  post,
  user,
  postId,
  postTitle,
  isBookmarked,
  isLiked,
  likeCount,
  showControls,
  hasNextVideo,
  hasPrevVideo,
  nextVideoId,
  prevVideoId,
  totalVideos
}: WatchPageClientProps) {
  const router = useRouter();
  const [showButtons, setShowButtons] = useState(false);
  const touchStartY = useRef<number | null>(null);
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    message: '',
    imageUrl: '',
    redirectUrl: '',
    buttonText: ''
  });
  const [shouldRestoreFullscreen, setShouldRestoreFullscreen] = useState(false);

  // 비디오 로드 감지 및 전체화면 복원
  useEffect(() => {
    if (shouldRestoreFullscreen) {
      const video = document.querySelector('video');
      if (video) {
        const handleLoadedMetadata = async () => {
          try {
            await video.requestFullscreen();
            setShouldRestoreFullscreen(false);
          } catch (error) {
            console.error('Failed to restore fullscreen:', error);
          }
        };

        video.addEventListener('loadedmetadata', handleLoadedMetadata);
        return () => video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      }
    }
  }, [shouldRestoreFullscreen, video.sequence]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
  
    const touchEndY = e.changedTouches[0].clientY;
    const deltaY = touchEndY - touchStartY.current;
    
    if (Math.abs(deltaY) > 50) {
      const isFullscreen = document.fullscreenElement !== null;
      
      if (deltaY < 0 && hasNextVideo) {
        if (isFullscreen) {
          setShouldRestoreFullscreen(true);
        }
        router.push(`/watch/${postId}?sequence=${video.sequence + 1}`);
      } else if (deltaY > 0 && hasPrevVideo) {
        if (isFullscreen) {
          setShouldRestoreFullscreen(true);
        }
        router.push(`/watch/${postId}?sequence=${video.sequence - 1}`);
      }
    }
    
    touchStartY.current = null;
  }, [hasNextVideo, hasPrevVideo, postId, video.sequence, router]);

  useEffect(() => {
    const preventDefault = (e: TouchEvent) => e.preventDefault();
    
    document.body.style.overflow = 'hidden';
    document.addEventListener('touchmove', preventDefault, { passive: false });
    
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('touchmove', preventDefault);
    };
  }, []);

  const handleVideoEnd = useCallback(async () => {
    if (hasNextVideo) {
      const isFullscreen = document.fullscreenElement !== null;
      
      if (isFullscreen) {
        // 전체화면 상태 저장
        setShouldRestoreFullscreen(true);
      }
      
      // 다음 영상으로 이동
      router.push(`/watch/${postId}?sequence=${video.sequence + 1}`);
    } else {
      setModalState({
        isOpen: true,
        message: '시청완료! 다음 추천컨텐츠!\n\n관리자 로직입력시 자동생성영역',
        imageUrl: '/MS Logo emblem.svg',
        redirectUrl: '/categories/recent',
        buttonText: '최신작 보러가기'
      });
    }
  }, [hasNextVideo, postId, video.sequence, router]);

  const handleNavigate = useCallback((direction: 'next' | 'prev') => {
    const isFullscreen = document.fullscreenElement !== null;
    
    if (direction === 'next' && hasNextVideo) {
      if (isFullscreen) {
        setShouldRestoreFullscreen(true);
      }
      router.push(`/watch/${postId}?sequence=${video.sequence + 1}`);
    } else if (direction === 'prev' && hasPrevVideo) {
      if (isFullscreen) {
        setShouldRestoreFullscreen(true);
      }
      router.push(`/watch/${postId}?sequence=${video.sequence - 1}`);
    }
  }, [hasNextVideo, hasPrevVideo, postId, video.sequence, router]);

  return (
    <div 
      className="fixed inset-0 bg-black overflow-hidden touch-none pt-[48px] md:pt-[70px] pb-1"

      onMouseMove={() => {
        setShowButtons(true);
        const timer = setTimeout(() => setShowButtons(false), 3000);
        return () => clearTimeout(timer);
      }}
      onTouchStart={(e) => {
        handleTouchStart(e);
        setShowButtons(true);
        const timer = setTimeout(() => setShowButtons(false), 3000);
        return () => clearTimeout(timer);
      }}
      onTouchEnd={handleTouchEnd}
    >
      <div className="relative aspect-[9/16] h-full mx-auto">
        <div 
          className={cn(
            "absolute inset-x-0 top-28 md:mb-8 z-10 transition-opacity duration-300",
            showButtons ? "opacity-100" : "opacity-0"
          )}
        >
          <div className="pl-8 md:pl-12 pt-4 text-white flex items-center relative">
            <div className="bg-gradient-to-r from-black/70 to-transparent px-4 py-2 rounded-lg">
              <h1 className="text-sm md:text-lg text-slate-100 inline">{postTitle}</h1>
              <h1 className="text-sm md:text-lg text-white pl-2 inline-block">EP.{video.sequence}</h1>
              <p className="text-xl font-semibold pl-2 inline-block relative top-[4px]">👀</p>
            </div>
          </div>
        </div>
  
        <VideoPlayer
          videoId={video.url.split('/')[3]}
          postId={postId}
          sequence={video.sequence}
          isActive={true}
          onEnded={handleVideoEnd}
          className="w-full h-full"
          key={video.sequence}
        />
  
        <PlayPermissionCheck
          postId={postId}
          videoId={video.id}
          playOrder={video.sequence}
          ageLimit={post.ageLimit}
          isPremium={video.isPremium}
          setIsActive={() => {}}
          onPermissionCheck={(code) => {
            switch (code) {
              case 1:
                setModalState({
                  isOpen: true,
                  message: '로그인이 필요한 컨텐츠입니다.',
                  imageUrl: '/MS Logo emblem.svg',
                  redirectUrl: '/login',
                  buttonText: '로그인 이동'
                });
                break;
              case 2:
                setModalState({
                  isOpen: true,
                  message: '성인인증이 필요한 컨텐츠입니다.',
                  imageUrl: '/MS Logo emblem.svg',
                  redirectUrl: '/',
                  buttonText: '홈으로 이동'
                });
                break;
              case 3:
                setModalState({
                  isOpen: true,
                  message: '프리미엄 컨텐츠입니다.\n구독 또는 코인으로 이용하세요',
                  imageUrl: '/MS Logo emblem.svg',
                  redirectUrl: '/subscription',
                  buttonText: '이용하러 가기'
                });
                break;
              case 4:
                setModalState({
                  isOpen: true,
                  message: '코인이용 에러입니다.\n다시 시도해 주세요',
                  imageUrl: '/MS Logo emblem.svg',
                  redirectUrl: '/',
                  buttonText: '홈으로 이동'
                });
                break;
            }
          }}
        />
  
        <div 
          className={cn(
            "absolute right-4 bottom-32 md:right-[-5.5rem] md:bottom-30 z-10 transition-opacity duration-300",
            showButtons ? "opacity-100" : "opacity-0"
          )}
          onClick={(e) => e.stopPropagation()}
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
            hasNextVideo={hasNextVideo}
            hasPrevVideo={hasPrevVideo}
            onNavigate={handleNavigate}
            visible={showButtons}
            videos={post.videos}
          />
        </div>
      </div>
      <AlertModal {...modalState} onClose={() => setModalState(prev => ({ ...prev, isOpen: false }))} />
    </div>
  );
}