'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { AlertModal } from '@/components/ui/AlertModal';
import PlayPermissionCheck from '@/components/videos/PlayPermissionCheck';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { User } from '@prisma/client';
import WatchVideoPlayer from '@/components/videos/WatchVideoPlayer';
import CustomVideoControls from '@/components/videos/CustomVideoControls';

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
  isBookmarked: boolean;
  isLiked: boolean;
  likeCount: number;
  hasNextVideo: boolean;
  hasPrevVideo: boolean;
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
  hasNextVideo,
  hasPrevVideo,
}: WatchPageClientProps) {
  const router = useRouter();
  const [showButtons, setShowButtons] = useState(false);
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    message: '',
    imageUrl: '',
    redirectUrl: '',
    buttonText: ''
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [shouldRestoreFullscreen, setShouldRestoreFullscreen] = useState(false);


// 전체화면 상태 감지
useEffect(() => {
  const handleFullscreenChange = () => {
    setIsFullscreen(!!document.fullscreenElement);
  };

  document.addEventListener('fullscreenchange', handleFullscreenChange);
  return () => {
    document.removeEventListener('fullscreenchange', handleFullscreenChange);
  };
}, []);

// 비디오 전환 시 전체화면 복원
useEffect(() => {
  if (shouldRestoreFullscreen && videoRef.current) {
    const restoreFullscreen = async () => {
      try {
        const video = videoRef.current;
        if (!video) return;

        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

        if (isMobile) {
          if ('webkitEnterFullscreen' in video) {
            await (video as any).webkitEnterFullscreen();
          } else {
            await video.requestFullscreen();
          }
        } else {
          await containerRef.current?.requestFullscreen();
        }
      } catch (error) {
        console.error('Failed to restore fullscreen:', error);
      } finally {
        setShouldRestoreFullscreen(false);
      }
    };

    // 비디오가 로드되고 재생 가능할 때 전체화면 복원
    const handleCanPlay = () => {
      restoreFullscreen();
      videoRef.current?.removeEventListener('canplay', handleCanPlay);
    };

    videoRef.current.addEventListener('canplay', handleCanPlay);
    return () => {
      videoRef.current?.removeEventListener('canplay', handleCanPlay);
    };
  }
}, [shouldRestoreFullscreen]);


// 네비게이션 핸들러 수정
const handleNavigate = useCallback((direction: 'next' | 'prev') => {
  const newSequence = direction === 'next' ? video.sequence + 1 : video.sequence - 1;
  
  if (direction === 'next' && hasNextVideo) {
    // replace 사용하여 히스토리 스택 방지
    router.replace(`/watch/${postId}?sequence=${newSequence}`);
  } else if (direction === 'prev' && hasPrevVideo) {
    router.replace(`/watch/${postId}?sequence=${newSequence}`);
  }
}, [hasNextVideo, hasPrevVideo, postId, video.sequence, router]);


// 비디오 종료 핸들러 수정
const handleVideoEnd = useCallback(async () => {
  if (hasNextVideo) {
    if (isFullscreen) {
      setShouldRestoreFullscreen(true);
    }
    router.replace(`/watch/${postId}?sequence=${video.sequence + 1}`);
  } else {
    setModalState({
      isOpen: true,
      message: '시청완료! 다음 추천컨텐츠!\n\n관리자 로직입력시 자동생성영역',
      imageUrl: '/MS Logo emblem.svg',
      redirectUrl: '/categories/recent',
      buttonText: '최신작 보러가기'
    });
  }
}, [hasNextVideo, postId, video.sequence, router, isFullscreen]);
  // 컨트롤 표시 관리
  const handleInteraction = useCallback(() => {
    setShowButtons(true);
    const timer = setTimeout(() => setShowButtons(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div 
      className="fixed inset-0 bg-black overflow-hidden"
      style={{ 
        height: '100dvh',  // dynamic viewport height
        WebkitUserSelect: 'none',
        userSelect: 'none',
        WebkitTouchCallout: 'none',
        touchAction: 'manipulation'
      }}
    >
      <div 
        ref={containerRef} 
        className="relative aspect-[9/16] h-full mx-auto video-container"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999
        }}
      >
        <WatchVideoPlayer
          videoRef={videoRef}
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

        <CustomVideoControls
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
          videoRef={videoRef}
          containerRef={containerRef}
          sequence={video.sequence}
        />
      </div>
      <AlertModal {...modalState} onClose={() => setModalState(prev => ({ ...prev, isOpen: false }))} />
    </div>
  );
}