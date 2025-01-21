'use client';

import { Share2, NotebookText, ChevronLeft, ChevronRight, Volume2, VolumeX, Maximize, Minimize } from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import LikeButtonOnly from "../posts/LikeButtonOnly";
import BookmarkButton from "../posts/BookmarkButton";
import { useSession } from "../SessionProvider";
import { useRouter } from 'next/navigation';
import Link from "next/link";

interface VideoControlsProps {
  postId: string;
  initialBookmarkState: {
    isBookmarkedByUser: boolean;
  };
  initialLikeState: {
    likes: number;
    isLikedByUser: boolean;
  };
  hasNextVideo: boolean;
  hasPrevVideo: boolean;
  onNavigate: (direction: 'next' | 'prev') => void;
  visible?: boolean;
  videos: {
    id: string;
    url: string;
    sequence: number;
    isPremium: boolean;
  }[];
  videoRef: React.RefObject<HTMLVideoElement>;
  containerRef: React.RefObject<HTMLDivElement>;
  sequence: number; 
}

export default function CustomVideoControls({
  postId,
  initialBookmarkState,
  initialLikeState,
  hasNextVideo,
  hasPrevVideo,
  onNavigate,
  videoRef,
  containerRef,
  sequence,
}: VideoControlsProps) {
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();
  const { toast } = useToast();
  const { user } = useSession();
  const router = useRouter();
  const [isMuted, setIsMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [progress, setProgress] = useState(0);
  const progressBarRef = useRef<HTMLDivElement>(null);

  // 컨트롤 표시 업데이트
  const updateControlsVisibility = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    setShowControls(true);
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  }, []);

  // 클린업
  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  // 비디오 상태 감지
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      if (video.duration > 0) {
        setProgress((video.currentTime / video.duration) * 100);
      }
    };

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    setIsMuted(video.muted);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('volumechange', () => setIsMuted(video.muted));
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('volumechange', () => setIsMuted(video.muted));
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [videoRef]);

  // URL 공유
  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/posts/${postId}`);
      toast({
        description: 'URL이 복사되었습니다.'
      });
    } catch (err) {
      toast({
        variant: "destructive",
        description: 'URL 복사에 실패했습니다.'
      });
    }
  };

  // 음소거 토글
  const handleMuteToggle = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
  };

  // 전체화면 토글
  const handleFullscreenToggle = async () => {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return;
  
    try {
      // iOS Safari
      if ('webkitEnterFullscreen' in video) {
        if (!document.fullscreenElement) {
          await (video as any).webkitEnterFullscreen();
        }
        return;
      }
  
      // 다른 브라우저
      if (!document.fullscreenElement) {
        await container.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  };

// sequence 변경 감지용 useEffect 추가
useEffect(() => {
  setProgress(0);  // 비디오 전환 시 진행바 초기화
}, [sequence]);

// 비디오 상태 감지 useEffect 수정
useEffect(() => {
  const video = videoRef.current;
  if (!video) return;

  const handleTimeUpdate = () => {
    if (video.duration > 0) {
      setProgress((video.currentTime / video.duration) * 100);
    }
  };

  const handleLoadedMetadata = () => {
    setProgress(0);  // 메타데이터 로드 시 초기화
  };

  video.addEventListener('timeupdate', handleTimeUpdate);
  video.addEventListener('loadedmetadata', handleLoadedMetadata);
  video.addEventListener('volumechange', () => setIsMuted(video.muted));
  document.addEventListener('fullscreenchange', () => setIsFullscreen(!!document.fullscreenElement));

  // 초기 상태 설정
  setIsMuted(video.muted);
  if (video.duration > 0) {
    handleTimeUpdate();
  }

  return () => {
    video.removeEventListener('timeupdate', handleTimeUpdate);
    video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    video.removeEventListener('volumechange', () => setIsMuted(video.muted));
    document.removeEventListener('fullscreenchange', () => setIsFullscreen(!!document.fullscreenElement));
  };
}, [videoRef, sequence]);

  // 진행바 클릭
  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const video = videoRef.current;
    const progressBar = progressBarRef.current;
    if (!video || !progressBar || !video.duration) return;
  
    const rect = progressBar.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const newTime = pos * video.duration;
    
    video.currentTime = newTime;
    setProgress((newTime / video.duration) * 100);  // 즉시 업데이트
  };

  return (
    <div 
      className={cn(
        "absolute inset-0 transition-opacity duration-300",
        showControls ? "opacity-100" : "opacity-0"
      )}
      onClick={updateControlsVisibility}
      onMouseMove={updateControlsVisibility}
      onTouchStart={updateControlsVisibility}
    >
      <div 
        className="absolute inset-x-0 bottom-0 mb-6 h-1 bg-white/30 cursor-pointer"
        ref={progressBarRef}
        onClick={handleProgressBarClick}
      >
        <div 
          className="h-full bg-white"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="absolute right-1 md:right-[1rem] bottom-18 md:bottom-0 translate-y-10 flex flex-col gap-2 md:gap-3">
        {hasPrevVideo && (
          <div 
            onClick={() => onNavigate('prev')}
            className="group flex flex-col items-center gap-1 cursor-pointer"
          >
            <div className="rounded-full bg-black/40 p-3 md:p-4 backdrop-blur-lg transition-all group-hover:bg-black/40 border border-white/40">
              <ChevronLeft className="h-7 w-7 md:h-7 md:w-7 text-white" />
            </div>
          </div>
        )}

        {hasNextVideo && (
          <div 
            onClick={() => onNavigate('next')}
            className="group flex flex-col items-center gap-1 cursor-pointer"
          >
            <div className="rounded-full bg-black/40 p-3 md:p-4 backdrop-blur-lg transition-all group-hover:bg-black/40 border border-white/40">
              <ChevronRight className="h-7 w-7 md:h-7 md:w-7 text-white" />
            </div>
          </div>
        )}

        {user! && (
          <><div className="group flex flex-col items-center gap-1">
            <div className="rounded-full bg-black/40 p-4 md:p-5 backdrop-blur-lg transition-all group-hover:bg-black/40 border border-white/40">
              <BookmarkButton
                postId={postId}
                initialState={initialBookmarkState}
              />
            </div>
          </div><div className="group flex flex-col items-center gap-1">
            <div className="rounded-full bg-black/40 p-4 md:p-5 backdrop-blur-lg transition-all group-hover:bg-black/40 border border-white/40">
              <LikeButtonOnly
                postId={postId}
                initialState={initialLikeState}
              />
            </div>
          </div></>
        )}

        <div className="group flex flex-col items-center gap-1">
          <div 
            onClick={handleMuteToggle}
            className="rounded-full bg-black/40 p-4 md:p-5 backdrop-blur-lg transition-all group-hover:bg-black/40 border border-white/40 cursor-pointer"
          >
            {isMuted ? 
              <VolumeX className="h-5 w-5 md:h-5 md:w-5 text-white" /> : 
              <Volume2 className="h-5 w-5 md:h-5 md:w-5 text-white" />
            }
          </div>
        </div>

        <div className="group flex flex-col items-center gap-1">
          <div 
            onClick={handleFullscreenToggle}
            className="rounded-full bg-black/40 p-4 md:p-5 backdrop-blur-lg transition-all group-hover:bg-black/40 border border-white/40 cursor-pointer"
          >
            {isFullscreen ? 
              <Minimize className="h-5 w-5 md:h-5 md:w-5 text-white" /> : 
              <Maximize className="h-5 w-5 md:h-5 md:w-5 text-white" />
            }
          </div>
        </div>

        <div className="group flex flex-col items-center gap-1">
          <Link href={`/posts/${postId}`}> 
            <div className="rounded-full bg-black/40 p-4 md:p-5 backdrop-blur-lg transition-all group-hover:bg-black/40 border border-white/40">
              <NotebookText className="h-5 w-5 md:h-5 md:w-5 text-white" />
            </div>
          </Link>
        </div>

        <div 
          onClick={handleShare}
          className="group flex flex-col items-center gap-1 cursor-pointer"
        >
          <div className="rounded-full bg-black/40 p-4 md:p-5 backdrop-blur-lg transition-all group-hover:bg-black/40 border border-white/40">
            <Share2 className="h-5 w-5 md:h-5 md:w-5 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
}