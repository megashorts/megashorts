'use client';

import { Share2, ChevronLeft, ChevronRight, VolumeX, ListCollapse, Volume2 } from "lucide-react";  // List -> Info로 변경
import { useState, useEffect, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import LikeButtonOnly from "../posts/LikeButtonOnly";
import BookmarkButton from "../posts/BookmarkButton";
import { useSession } from "../SessionProvider";
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
  onMuteToggle: (newState: boolean) => void; 
  isMuted: boolean;  
}

export default function VideoControls({
  postId,
  initialBookmarkState,
  initialLikeState,
  hasNextVideo,
  hasPrevVideo,
  onNavigate,
  onMuteToggle,
  isMuted,
}: VideoControlsProps) {
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();
  const { toast } = useToast();
  const { user } = useSession();

  const handleMuteToggle = () => {
    const newMuteState = !isMuted;
    onMuteToggle(newMuteState);
    
    // 언뮤트 상태를 localStorage에 저장
    if (!newMuteState) {
      localStorage.setItem('videoMuted', 'false');
    } else {
      localStorage.removeItem('videoMuted');
    }
  };

  const updateControlsVisibility = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }

    setShowControls(true);

    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  }, []);

  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

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
      <div className="absolute right-1 md:right-[1rem] bottom-1 md:bottom-0 translate-y-10 flex flex-col gap-2 md:gap-3">
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
                initialState={initialBookmarkState} />
            </div>
          </div><div className="group flex flex-col items-center gap-1">
              <div className="rounded-full bg-black/40 p-4 md:p-5 backdrop-blur-lg transition-all group-hover:bg-black/40 border border-white/40">
                <LikeButtonOnly
                  postId={postId}
                  initialState={initialLikeState} />
              </div>
            </div></>
        )}

        {/* <div className="group flex flex-col items-center gap-1">
          <Link href={`/posts/${postId}`}>  
            <div className="rounded-full bg-black/40 p-3 md:p-4 backdrop-blur-lg transition-all group-hover:bg-black/40 border border-white/40">
              <NotebookText className="h-7 w-7 md:h-7 md:w-7 text-white" />  
            </div>
          </Link>
        </div> */}

        <div className="group flex flex-col items-center gap-1">
          <Link href={`/posts/${postId}`}> 
            <div className="rounded-full bg-black/40 p-4 md:p-5 backdrop-blur-lg transition-all group-hover:bg-black/40 border border-white/40">
              {/* 아이콘 크기만 별도로 조정 */}
              <ListCollapse className="h-5 w-5 md:h-5 md:w-5 text-white" />
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

        <div 
          onClick={() => onMuteToggle(!isMuted)} 
          className="group flex flex-col items-center gap-1 cursor-pointer"
        >
          <div className={cn(
            "rounded-full p-4 md:p-5 backdrop-blur-lg transition-all border",
            isMuted 
              ? "bg-black/40 border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" 
              : "bg-black/40 border-white/40"
          )}>
            {isMuted ? (
              <VolumeX className={cn(
                "h-5 w-5 md:h-5 md:w-5",
                isMuted ? "text-red-500" : "text-white"
              )} />
            ) : (
              <VolumeX className="h-5 w-5 md:h-5 md:w-5 text-white" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}