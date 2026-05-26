"use client";

import { useState, useRef, useCallback, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Virtual, Mousewheel } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import VideoPlayer from '@/components/videos/VideoPlayer';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import VideoControls from '@/components/videos/VideoControls';
import 'swiper/css';
import 'swiper/css/virtual';
import { videoDB } from '@/lib/indexedDB';
import { useSession } from '@/components/SessionProvider';
import { useLocale } from 'next-intl';
import { useTranslations } from 'next-intl';
import { getLocalizedPostTitle, localeToVideoUserLanguage } from '@/lib/content-language';
import { usePwaVideoChrome } from '@/hooks/usePwaVideoChrome';
import { warmRecommendedPwaAssets } from '@/lib/pwa-video-preload';

const MS_RECOMMENDED_VIEW_INFO = 'ms_recommended_view_info';

interface RecommendedViewInfo {
  recommendedViewIndex: number;
  recommendedViewPostId: string;
}

interface RecommendedVideosClientProps {
  posts: {
    id: string;
    title: string | null;
    titleI18n?: unknown;
    content?: string | null;
    contentI18n?: unknown;
    postLanguage?: string;
    videos: {
      id: string;
      sequence: number;
      subtitle?: string[];
    }[];
  }[];
}

export function RecommendedVideosClient({ posts: initialPosts }: RecommendedVideosClientProps) {
  const { user } = useSession();
  const locale = useLocale();
  const tContent = useTranslations('Content');
  const userLanguage = localeToVideoUserLanguage(locale);
  const [loadedPosts, setLoadedPosts] = useState(initialPosts);
  const [activeIndex, setActiveIndex] = useState(0);
  const swiperRef = useRef<SwiperType>();
  const [showButtons, setShowButtons] = useState(false);
  const { isPwaMobile } = usePwaVideoChrome(showButtons);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const [currentTime, setCurrentTime] = useState(0);
  const [viewedVideos, setViewedVideos] = useState<Set<string>>(new Set());
  const [isMuted, setIsMuted] = useState(true);
  
  useEffect(() => {
    const savedMuteState = localStorage.getItem('videoMuted');
    if (savedMuteState === 'false') {
      setIsMuted(false);
    }

    // 이전 시청 위치 복원
    const savedViewInfo = localStorage.getItem(MS_RECOMMENDED_VIEW_INFO);
    if (savedViewInfo) {
      const { recommendedViewIndex } = JSON.parse(savedViewInfo) as RecommendedViewInfo;
      setActiveIndex(recommendedViewIndex);
      swiperRef.current?.slideTo(recommendedViewIndex);
    }
  }, []);

  // 시청하지 않은 포스트 필터링
  useEffect(() => {
  const loadViewHistory = async () => {
    try {
      // lastViews에서 sequence > 1인 포스트 ID 가져오기
      const watchingPosts = await videoDB.getWatchingPostIds();
      
      // 시청하지 않은 포스트만 필터링
      const unwatchedPosts = loadedPosts.filter(
        post => !watchingPosts.includes(post.id)
      );
        setLoadedPosts(unwatchedPosts);
      } catch (error) {
        console.error('Failed to load view history:', error);
      }
    };
    loadViewHistory();
  }, []);
  
  const handleMuteToggle = useCallback(() => {
    setIsMuted(prev => {
      const newState = !prev;
      if (!newState) {
        localStorage.setItem('videoMuted', 'false');
      } else {
        localStorage.removeItem('videoMuted');
      }
      return newState;
    });
  }, []);

  const updateButtonsVisibility = useCallback((event: React.MouseEvent | React.TouchEvent) => {
    event.stopPropagation();
    setShowButtons(true);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setShowButtons(false);
    }, 3000);
  }, []);

  const loadMorePosts = useCallback(async () => {
    try {
      const response = await fetch(`/api/posts/recommended?skip=${loadedPosts.length}&take=15&locale=${locale}`);
      const newPosts = await response.json();
      
      if (Array.isArray(newPosts) && newPosts.length > 0) {
        setLoadedPosts(prev => [...prev, ...newPosts]);
      }
    } catch (error) {
      console.error('Failed to load more posts:', error);
    }
  }, [loadedPosts.length, locale]);

  useEffect(() => {
    if (loadedPosts.length - activeIndex <= 5) {
      loadMorePosts();
    }
  }, [activeIndex, loadedPosts.length, loadMorePosts]);

  useEffect(() => {
    if (!isPwaMobile) return;
    warmRecommendedPwaAssets(loadedPosts, activeIndex);
  }, [activeIndex, isPwaMobile, loadedPosts]);

  const handleSlideChange = useCallback((swiper: SwiperType) => {
    setActiveIndex(swiper.activeIndex);

    // 현재 위치 저장
    const viewInfo: RecommendedViewInfo = {
      recommendedViewIndex: swiper.activeIndex,
      recommendedViewPostId: loadedPosts[swiper.activeIndex]?.id || ''
    };
    localStorage.setItem(MS_RECOMMENDED_VIEW_INFO, JSON.stringify(viewInfo));
  }, [loadedPosts]);

  const filterUnwatchedPosts = useCallback(async () => {
    // lastViews에서 sequence > 1인 포스트 ID 가져오기
    const watchingPosts = await videoDB.getWatchingPostIds();
    
    // 시청하지 않은 포스트만 필터링
    const unwatchedPosts = loadedPosts.filter(
      post => !watchingPosts.includes(post.id)
    );

    if (unwatchedPosts.length === 0) {
      // 모든 포스트를 시청했으면 처음부터 다시 시작
      localStorage.removeItem(MS_RECOMMENDED_VIEW_INFO);
      setLoadedPosts(initialPosts);
      setActiveIndex(0);
      swiperRef.current?.slideTo(0);
    } else {
      setLoadedPosts(unwatchedPosts);
      setActiveIndex(0);
      swiperRef.current?.slideTo(0);
    }
  }, [loadedPosts, initialPosts]);

  const handleVideoEnd = useCallback(() => {
    // 시청 기록 저장 제거 (sequence=1인 영상은 저장하지 않음)

    // 마지막 포스트인 경우
    if (activeIndex === loadedPosts.length - 1) {
      filterUnwatchedPosts();
    } else {
      swiperRef.current?.slideNext();
    }
  }, [activeIndex, loadedPosts, user, filterUnwatchedPosts]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div 
      className={cn(
        "fixed inset-0 bg-black overflow-hidden",
        isPwaMobile && "pwa-recommended-page"
      )}
      onMouseMove={updateButtonsVisibility}
      onTouchStart={updateButtonsVisibility}
    >
      <Swiper
        modules={[Virtual, Mousewheel]}
        direction="vertical"
        slidesPerView={1}
        spaceBetween={0}
        speed={300}
        mousewheel={{
          enabled: true,
          sensitivity: 1,
          thresholdDelta: 10,
          forceToAxis: true
        }}
        className="h-full w-full swiper-container aspect-[9/16]"
        onSwiper={(swiper) => {
          swiperRef.current = swiper;
        }}
        onSlideChange={handleSlideChange}
        initialSlide={0}
        observer={true}
        observeParents={true}
      >
        {loadedPosts.map((post, index) => {
          const video = post.videos[0];
          const streamId = video.id;
          const localizedTitle = getLocalizedPostTitle(post, locale);
          return (
            <SwiperSlide key={`${post.id}-${index}`}>
              <div className={cn(
                "w-full h-full flex items-center justify-center bg-black",
                isPwaMobile ? "pwa-recommended-slide" : "pt-[48px] md:pt-[70px] pb-1"
              )}>
                <div className={cn(
                  "relative aspect-[9/16] h-full mx-auto",
                  isPwaMobile && "max-h-[100dvh]"
                )}>
                  <div 
                    className={cn(
                      "absolute inset-x-0 md:mb-8 z-10 transition-opacity duration-300",
                      isPwaMobile ? "top-[max(0.75rem,env(safe-area-inset-top))]" : "top-10",
                      showButtons ? "opacity-100" : "opacity-0"
                    )}
                  >
                    <div className="pl-4 md:pl-4 pt-4 text-white flex items-center relative">
                      <div className="bg-gradient-to-r from-black/70 to-transparent px-4 py-2 rounded-lg">
                        <Link 
                          href={`/video-view/${post.id}?t=${currentTime}`}
                          className="hover:text-primary transition-colors"
                        >
                          <h1 className="text-base md:text-lg text-slate-100 inline">
                            {tContent('watchTitle', { title: localizedTitle })}
                          </h1>
                        </Link>
                        <p className="text-xl font-semibold inline-block pl-2 relative top-[3px]">👀</p>
                      </div>
                    </div>
                  </div>
                  
                  <VideoPlayer
                    videoId={streamId}
                    postId={post.id}
                    sequence={video.sequence}
                    isActive={index === activeIndex}
                    onEnded={handleVideoEnd}
                    onTimeUpdate={setCurrentTime}
                    className="w-full h-full aspect-[9/16]"
                    userLanguage={userLanguage}
                    muted={isMuted}
                    title={localizedTitle}
                    isPremium={false}
                  />

                  <div 
                    className={cn(
                      "z-10 transition-opacity duration-300",
                      isPwaMobile
                        ? "absolute right-2 bottom-[calc(env(safe-area-inset-bottom)+5.5rem)]"
                        : "relative right-4 bottom-32 md:right-[-5.5rem] md:bottom-30",
                      showButtons ? "opacity-100" : "opacity-0"
                    )}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <VideoControls
                      postId={post.id}
                      initialBookmarkState={{
                        isBookmarkedByUser: false
                      }}
                      initialLikeState={{
                        likes: 0,
                        isLikedByUser: false
                      }}
                      hasNextVideo={index < loadedPosts.length - 1}
                      hasPrevVideo={index > 0}
                      onNavigate={(direction) => {
                        if (direction === "next") {
                          swiperRef.current?.slideNext();
                        } else {
                          swiperRef.current?.slidePrev();
                        }
                      }}
                      visible={showButtons}
                      videos={[]}
                      onMuteToggle={handleMuteToggle}
                      isMuted={isMuted}
                    />
                  </div>
                </div>
              </div>
            </SwiperSlide>
          );
        })}
      </Swiper>
    </div>
  );
}
