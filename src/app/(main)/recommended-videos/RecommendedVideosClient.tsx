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

interface RecommendedVideosClientProps {
  posts: {
    id: string;
    title: string | null;
    videos: {
      id: string;
      url: string;
      sequence: number;
    }[];
  }[];
}

export function RecommendedVideosClient({ posts: initialPosts }: RecommendedVideosClientProps) {
  const { user } = useSession();
  const [loadedPosts, setLoadedPosts] = useState(initialPosts);
  const [activeIndex, setActiveIndex] = useState(0);
  const swiperRef = useRef<SwiperType>();
  const [showButtons, setShowButtons] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const [currentTime, setCurrentTime] = useState(0);
  const [viewedVideos, setViewedVideos] = useState<Set<string>>(new Set());
  const [isMuted, setIsMuted] = useState(true);
  
  useEffect(() => {
    const savedMuteState = localStorage.getItem('videoMuted');
    if (savedMuteState === 'false') {
      setIsMuted(false);
    }
  }, []);
  
  const handleMuteToggle = useCallback(() => {  // 이름 통일
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
  
    // 시청 기록 로드
    useEffect(() => {
      const loadViewHistory = async () => {
        try {
          const watchedVideos = await videoDB.getWatchedVideos();
          setViewedVideos(new Set(watchedVideos));
        } catch (error) {
          console.error('Failed to load view history:', error);
        }
      };
      loadViewHistory();
    }, []);

    const handleSlideChange = useCallback((swiper: SwiperType) => {
      const newIndex = swiper.activeIndex;
      console.log('Slide changed:', {
        newIndex,
        video: loadedPosts[newIndex].videos[0],
        sequence: loadedPosts[newIndex].videos[0].sequence,
        streamId: loadedPosts[newIndex].videos[0].url.split('/')[3]
      });
  
      setActiveIndex(newIndex);
  
      // 로그인한 사용자만 시청 기록 체크
      if (user) {
        const currentVideoId = loadedPosts[newIndex].videos[0].id;
        if (viewedVideos.has(currentVideoId)) {
          // 다음 미시청 비디오 찾기
          let nextIndex = newIndex;
          for (let i = newIndex + 1; i < loadedPosts.length; i++) {
            if (!viewedVideos.has(loadedPosts[i].videos[0].id)) {
              nextIndex = i;
              break;
            }
          }
          // 모든 비디오를 시청했다면 처음부터 다시 시작
          if (nextIndex === newIndex && newIndex === loadedPosts.length - 1) {
            setViewedVideos(new Set());
            swiper.slideTo(0);
            return;
          }
          // 다음 미시청 비디오로 이동
          if (nextIndex !== newIndex) {
            swiper.slideTo(nextIndex);
          }
        }
      }
  
      // 1개 시청 후 슬라이드 시 자동 추가 로딩
      if (loadedPosts.length - newIndex <= 2) {
        fetch(`/api/posts/recommended?skip=${loadedPosts.length}&take=5`)
          .then(res => res.json())
          .then(newPosts => {
            if (newPosts.length > 0) {
              setLoadedPosts(prev => [...prev, ...newPosts]);
            }
          })
          .catch(error => {
            console.error('Failed to load more posts:', error);
          });
      }
    }, [loadedPosts, viewedVideos, user]); // user 의존성 추가
  
    // handleVideoEnd도 수정
    const handleVideoEnd = useCallback(() => {
      // 로그인한 사용자만 시청 기록 추가
      if (user) {
        const currentVideoId = loadedPosts[activeIndex].videos[0].id;
        setViewedVideos(prev => new Set(prev).add(currentVideoId));
      }
      swiperRef.current?.slideNext();
    }, [activeIndex, loadedPosts, user]); // user 의존성 추가

  return (
    <div 
      className="fixed inset-0 bg-black overflow-hidden"
      onMouseMove={updateButtonsVisibility}
      onTouchStart={updateButtonsVisibility}
    >
      <Swiper
        modules={[Virtual, Mousewheel]}
        direction="vertical"
        slidesPerView={1}
        spaceBetween={0}
        speed={400}
        mousewheel={{
          enabled: true,
          sensitivity: 1,
          thresholdDelta: 20,
          forceToAxis: true,
          releaseOnEdges: false,
          eventsTarget: '.swiper-container'
        }}
        virtual
        className="h-full w-full swiper-container aspect-[9/16]"
        onSwiper={(swiper) => {
          console.log('onSwiper called');
          swiperRef.current = swiper;
        }}
        onSlideChange={handleSlideChange}
        onReachBeginning={(swiper) => {
          console.log('reachBeginning');
          swiper.allowSlidePrev = false;
        }}
        onReachEnd={(swiper) => {
          console.log('reachEnd');
          swiper.allowSlideNext = false;
        }}
        onFromEdge={(swiper) => {
          console.log('fromEdge');
          swiper.allowSlidePrev = true;
          swiper.allowSlideNext = true;
        }}
        initialSlide={0}
        watchSlidesProgress={true}
        observer={true}
        observeParents={true}
      >
        {loadedPosts.map((post, index) => {
          const video = post.videos[0];
          const streamId = video.url.split('/')[3];
          return (
            <SwiperSlide key={`${post.id}-${index}`} virtualIndex={index}>
              <div className="w-full h-full flex items-center justify-center bg-black pt-[48px] md:pt-[70px] pb-1">
                <div className="relative aspect-[9/16] h-full mx-auto">
                  <div 
                    className={cn(
                      "absolute inset-x-0 top-10 md:mb-8 z-10 transition-opacity duration-300",
                      showButtons ? "opacity-100" : "opacity-0"
                    )}
                  >
                    <div className="pl-4 md:pl-4 pt-4 text-white flex items-center relative">
                      <div className="bg-gradient-to-r from-black/70 to-transparent px-4 py-2 rounded-lg">
                        <Link 
                          // href={`/video-view/${post.id}`}
                          href={`/video-view/${post.id}?t=${currentTime}`}
                          className="hover:text-primary transition-colors"
                        >
                          <h1 className="text-base md:text-lg text-slate-100 inline">{post.title} 보러가기</h1>
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
                    userLanguage="KOREAN"
                    muted={isMuted}
                  />

                  <div 
                    className={cn(
                      "relative right-4 bottom-32 md:right-[-5.5rem] md:bottom-30 z-10 transition-opacity duration-300",
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
                      hasNextVideo={true}
                      hasPrevVideo={true}
                      onNavigate={(direction) => {
                        if (direction === "next") {
                          swiperRef.current?.slideNext();
                        } else {
                          swiperRef.current?.slidePrev();
                        }
                      } }
                      visible={showButtons} videos={[]}     
                      onMuteToggle={handleMuteToggle}  // 이름 통일
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