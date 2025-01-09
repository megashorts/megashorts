'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Virtual, Mousewheel } from 'swiper/modules';
import { Heart, Bookmark, Share2, List } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { PostWithVideos } from '../../lib/types';
import type { Swiper as SwiperType } from 'swiper';
import VideoPlayer from './VideoPlayer';
import { useRouter, useSearchParams } from 'next/navigation';

import 'swiper/css';
import 'swiper/css/virtual';

// 기존 인터페이스들 유지
interface VideoControlsProps {
  isLiked: boolean;
  isBookmarked: boolean;
  onLike: () => void;
  onBookmark: () => void;
  onShare: () => void;
  onList: () => void;
}

// 기존 getVideoId 함수 유지
function getVideoId(url: string) {
  try {
    if (!url) return null;
    
    // videodelivery.net URL 처리
    if (url.includes('videodelivery.net')) {
      const matches = url.match(/videodelivery\.net\/([^\/]+)/);
      if (matches && matches[1]) return matches[1];
    }
    
    // cloudflarestream.com URL 처리 (기존 코드)
    if (url.includes('cloudflarestream.com')) {
      const matches = url.match(/cloudflarestream\.com\/([^\/\?]+)/);
      if (matches && matches[1]) return matches[1];
    }
    
    return null;
  } catch (error) {
    console.error('Error parsing video URL:', error);
    return null;
  }
}

// VideoControls 컴포넌트 유지
function VideoControls({
  isLiked,
  isBookmarked,
  onLike,
  onBookmark,
  onShare,
  onList,
}: VideoControlsProps) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

  return (
    <div
      className={cn(
        'flex flex-col gap-4 z-10',
        isMobile 
          ? 'absolute bottom-4 right-4' 
          : 'absolute bottom-4 right-[-4rem] flex-col'
      )}
    >
      {/* 기존 버튼들 유지 */}
      <button
        onClick={onLike}
        className="group flex flex-col items-center gap-1"
      >
        <div className="rounded-full bg-black/20 p-2 backdrop-blur-lg transition-all group-hover:bg-black/40">
          <Heart
            className={cn(
              'h-6 w-6 transition-colors',
              isLiked ? 'fill-red-500 text-red-500' : 'text-white'
            )}
          />
        </div>
      </button>

      <button
        onClick={onBookmark}
        className="group flex flex-col items-center gap-1"
      >
        <div className="rounded-full bg-black/20 p-2 backdrop-blur-lg transition-all group-hover:bg-black/40">
          <Bookmark
            className={cn(
              'h-6 w-6 transition-colors',
              isBookmarked ? 'fill-yellow-500 text-yellow-500' : 'text-white'
            )}
          />
        </div>
      </button>

      <button
        onClick={onList}
        className="group flex flex-col items-center gap-1"
      >
        <div className="rounded-full bg-black/20 p-2 backdrop-blur-lg transition-all group-hover:bg-black/40">
          <List className="h-6 w-6 text-white" />
        </div>
      </button>

      <button
        onClick={onShare}
        className="group flex flex-col items-center gap-1"
      >
        <div className="rounded-full bg-black/20 p-2 backdrop-blur-lg transition-all group-hover:bg-black/40">
          <Share2 className="h-6 w-6 text-white" />
        </div>
      </button>
    </div>
  );
}

// VideoSlide 컴포넌트 수정
interface VideoSlideProps {
  post: PostWithVideos;
  isActive: boolean;
  onVideoEnd?: () => void;
}

function VideoSlide({ post, isActive, onVideoEnd }: VideoSlideProps) {
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
  const currentVideo = post.videos[0];
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  const handleFullscreen = useCallback(() => {
    if (!videoContainerRef.current) return;
    
    if (!document.fullscreenElement) {
      videoContainerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // const updateControlsVisibility = () => {
  //   setShowControls(true);
  // };
  const updateControlsVisibility = useCallback(() => {
    // 기존 타이머 취소
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }

    setShowControls(true);

    // 전체화면일 때만 자동 숨김 적용
    if (isFullscreen) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  }, [isFullscreen]);

  if (!currentVideo?.url) return null;
  const videoId = getVideoId(currentVideo.url);
  if (!videoId) return null;


  return (
    <div 
      className="relative h-full w-full flex items-center justify-center"
      onMouseMove={updateControlsVisibility}
      onTouchStart={updateControlsVisibility}
    >
      <div 
        ref={videoContainerRef}
        className={cn(
          'relative aspect-[9/16]',
          isMobile ? 'h-[calc(100vh-12rem)]' : 'h-[70vh]'
        )}
      >
        <div className="relative w-full h-full">
        <VideoPlayer
        videoId={videoId}
        postId={post.id}  // url 대신 postId 전달
        sequence={currentVideo.sequence || 1}  // sequence 추가
        isActive={isActive}
        onEnded={onVideoEnd}
        className={cn(
            'w-full h-full',
            isFullscreen ? 'object-contain' : 'object-cover'
        )}
        />
          {/* showControls로 모든 컨트롤을 함께 감싸기 */}
          {showControls && (
            <div className="absolute inset-0"> {/* 전체 컨트롤 컨테이너 */}
              <button
                onClick={handleFullscreen}
                className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 to-transparent px-5 py-5 z-10"
              >
                {isFullscreen ? (
                  <h2 className="text-sm text-white text-left">← 전체화면 나가기</h2>
                ) : (
                  <h2 className="text-sm text-white text-left">{post.title} 바로보기 👀</h2>
                )}
              </button>
  
              {/* VideoControls도 같은 showControls 상태를 공유 */}
              <VideoControls
                isLiked={false}
                isBookmarked={false}
                onLike={() => {}}
                onBookmark={() => {}}
                onShare={() => {
                  navigator.share?.({
                    title: post.title || '',
                    text: post.content || '',
                    url: window.location.href,
                  });
                }}
                onList={() => {}}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// FullScreenVideo 컴포넌트 유지
interface FullScreenVideoProps {
  posts: PostWithVideos[];
  className?: string;
}

export default function FullScreenVideo({ posts, className }: FullScreenVideoProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const swiperRef = useRef<SwiperType>();
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
  const router = useRouter();
  const searchParams = useSearchParams();
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoContainerRef = useRef<HTMLDivElement>(null);

  // 기존의 모든 useEffect들 유지
  useEffect(() => {
    const videoId = searchParams.get('v');
    if (videoId) {
      const index = posts.findIndex(post => post.videos[0]?.url?.includes(videoId));
      if (index !== -1) {
        setActiveIndex(index);
        swiperRef.current?.slideTo(index);
      }
    }
  }, [posts, searchParams]);

  useEffect(() => {
    const preloadNextVideo = (index: number) => {
      const nextIndex = (index + 1) % posts.length;
      const nextPost = posts[nextIndex];
      if (nextPost?.videos[0]?.url) {
        const videoId = getVideoId(nextPost.videos[0].url);
        if (videoId) {
          const img = new Image();
          img.src = `https://videodelivery.net/${videoId}/thumbnails/thumbnail.jpg`;
        }
      }
    };

    preloadNextVideo(activeIndex);
  }, [activeIndex, posts]);

  // // cleanup 추가 (useEffect 추가)
  // useEffect(() => {
  // return () => {
  //   if (controlsTimeoutRef.current) {
  //     clearTimeout(controlsTimeoutRef.current);
  //   }
  // };
  // }, []);

  useEffect(() => {
    const timeoutRef = controlsTimeoutRef.current;  // ref 값을 effect 내부 변수로 복사
    
    return () => {
      if (timeoutRef) {  // 복사된 변수 사용
        clearTimeout(timeoutRef);
      }
    };
  }, []);  // 의존성 배열은 빈 상태로 유지

  useEffect(() => {
    const preventDefault = (e: Event) => {
      if (e.target instanceof Element && !e.target.closest('.swiper-container')) {
        e.preventDefault();
      }
    };
    
    document.addEventListener('wheel', preventDefault, { passive: false });
    document.addEventListener('touchmove', preventDefault, { passive: false });

    return () => {
      document.removeEventListener('wheel', preventDefault);
      document.removeEventListener('touchmove', preventDefault);
    };
  }, []);

  if (!posts || posts.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-lg text-gray-500">당신만의 추천리스트!</p>
      </div>
    );
  }

  const handleVideoEnd = () => {
    if (activeIndex < posts.length - 1) {
      console.log('Moving to next slide');
      swiperRef.current?.slideNext();
    }
  };

  const handleSlideChange = (swiper: SwiperType) => {
    const newIndex = swiper.activeIndex;
    
    // 현재 슬라이드 비활성화
    setActiveIndex(-1);
    
    // 새 슬라이드로 전환 후 활성화
    requestAnimationFrame(() => {
      setActiveIndex(newIndex);
      
      // URL 업데이트
      const currentPost = posts[newIndex];
      if (currentPost?.videos[0]?.url) {
        const videoId = getVideoId(currentPost.videos[0].url);
        if (videoId) {
          const params = new URLSearchParams(searchParams.toString());
          params.set('v', videoId);
          router.push(`?${params.toString()}`, { scroll: false });
        }
      }
    });
  };

  return (
    <div className={cn(
      'relative w-full overflow-hidden',
      // isMobile ? 'h-[80vh] object-fit: contain' : 'h-[80vh]', // 'h-[calc(100vh-12rem)]'
      isMobile ? 'h-[calc(100vh-12rem)]' : 'h-[80vh]',
      className
    )}>
      <Swiper
        modules={[Virtual, Mousewheel]}
        direction="vertical"
        slidesPerView={1}
        spaceBetween={0} // 0 -> 16
        speed={400}
        mousewheel={{
          enabled: true,
          sensitivity: 1,
          thresholdDelta: 20,
          forceToAxis: true,
          releaseOnEdges: true
        }}
        virtual
        className="h-full w-full swiper-container"
        // className={cn(
        //   'relative w-full overflow-hidden',
        //   isMobile ? 'h-[calc(100vh-12rem)]' : 'h-[80vh]')}
        onSwiper={(swiper) => {
          swiperRef.current = swiper;
        }}
        onSlideChange={handleSlideChange}

        watchSlidesProgress={true}
        observer={true}
        observeParents={true}
      >
        {posts.map((post, index) => (
          <SwiperSlide key={post.id} virtualIndex={index} className="h-full">
            <VideoSlide
              post={post}
              isActive={index === activeIndex}
              onVideoEnd={handleVideoEnd}
            />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}