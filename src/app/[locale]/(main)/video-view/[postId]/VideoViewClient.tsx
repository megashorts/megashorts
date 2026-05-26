'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Virtual, Mousewheel } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import VideoPlayer from '@/components/videos/VideoPlayer';
import 'swiper/css';
import 'swiper/css/virtual';
import { toast } from '@/components/ui/use-toast';
import { AlertModal } from '@/components/ui/AlertModal';
import PlayPermissionCheck from '@/components/videos/PlayPermissionCheck';
import AgeVerificationModal from '@/components/AgeVerificationModal';
import { cn } from '@/lib/utils';
import VideoControls from '@/components/videos/VideoControls';
import { useSearchParams } from 'next/navigation';
import { videoDB } from '@/lib/indexedDB';
import { ResumeModal } from '@/components/ui/ResumeModal';
import { useLocale, useTranslations } from 'next-intl';
import { getLocalizedPostTitle, localeToVideoUserLanguage } from '@/lib/content-language';
import { usePwaVideoChrome } from '@/hooks/usePwaVideoChrome';
import { warmPwaVideoIds } from '@/lib/pwa-video-preload';

interface ModalState {
  isOpen: boolean;
  message: string;
  imageUrl: string;
  redirectUrl?: string;
  buttonText?: string;
}

interface VideoViewClientProps {
  post: {
    id: string;
    ageLimit: number;
    title: string | null;
    titleI18n?: unknown;
    content?: string | null;
    contentI18n?: unknown;
    postLanguage?: string;
    userId: string;
    videos: {
      id: string;
      sequence: number;
      isPremium: boolean;
      subtitle?: string[];
    }[];
  };
  initialSequence: number;
  initialTime: number;
}

export function VideoViewClient({ post, initialSequence, initialTime }: VideoViewClientProps) {
  // 이어보기 파라미터
  const searchParams = useSearchParams();
  const locale = useLocale();
  const tContent = useTranslations('Content');
  const localizedTitle = getLocalizedPostTitle(post, locale);
  const userLanguage = localeToVideoUserLanguage(locale);
  const [resumeData, setResumeData] = useState<{sequence: number, timestamp: number} | null>(null);
  const [showResumeModal, setShowResumeModal] = useState(false);  

  const initialIndex = Math.max(0, post.videos.findIndex(v => v.sequence === initialSequence));
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const swiperRef = useRef<SwiperType>();
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    message: '',
    imageUrl: '',
  });
  const [showButtons, setShowButtons] = useState(false);
  const { isPwaMobile } = usePwaVideoChrome(showButtons);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const [isMuted, setIsMuted] = useState(true);
  const resumeHandledRef = useRef(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showAgeVerification, setShowAgeVerification] = useState(false);

  useEffect(() => {
    const savedMuteState = localStorage.getItem('videoMuted');
    if (savedMuteState === 'false') {
      setIsMuted(false);
    }
  }, []);
  
  // setIsMuted의 prev => !prev 패턴 사용
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

  useEffect(() => {
    const checkResumePoint = async () => {
      // 이미 처리된 경우 스킵
      if (resumeHandledRef.current) return;

      try {
        const timeParam = searchParams.get('t');
        const lastView = await videoDB.getLastView(post.id);
        
        if (lastView && lastView.sequence >= initialSequence && lastView.sequence > 1) {  
          setResumeData({
            sequence: lastView.sequence,
            timestamp: lastView.timestamp
          });
          setShowResumeModal(true);
        } else if (timeParam) {
          const time = parseInt(timeParam, 10);
          if (!isNaN(time)) {
            setActiveIndex(0);
            const video = document.querySelector('video');
            if (video) {
              video.currentTime = time;
            }
          }
        }
        // 처리 완료 표시
        resumeHandledRef.current = true;
      } catch (error) {
        console.error('Failed to check resume point:', error);
      }
    };

    checkResumePoint();
  }, [post.id, initialSequence, searchParams]);

  // 마우스 움직임 감지 핸들러 추가
  // const updateButtonsVisibility = useCallback(() => {
  const updateButtonsVisibility = useCallback((event: React.MouseEvent | React.TouchEvent) => {
    // 이벤트 전파 중지로 비디오 컨트롤에 영향 주지 않음
    event.stopPropagation(); 
    setShowButtons(true);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setShowButtons(false);
    }, 3000);
  }, []);

  const handleSlideChange = useCallback((swiper: SwiperType) => {
    console.log('Slide changed:', {
      newIndex: swiper.activeIndex,
      video: post.videos[swiper.activeIndex],
      sequence: post.videos[swiper.activeIndex].sequence,
      streamId: post.videos[swiper.activeIndex].id
    });
    setActiveIndex(swiper.activeIndex);
  }, [post.videos]);

  useEffect(() => {
    if (!isPwaMobile) return;
    warmPwaVideoIds(
      post.videos
        .slice(activeIndex + 1, activeIndex + 3)
        .map((video) => video.id),
    );
  }, [activeIndex, isPwaMobile, post.videos]);

  const handleVideoEnd = useCallback(() => {
    if (activeIndex === post.videos.length - 1) {
      setModalState({
        isOpen: true,
        message: tContent('watchCompleteMessage'),
        imageUrl: '/MS Logo emblem.svg',
        redirectUrl: `/categories/recent`,
        buttonText: tContent('goLatest')
      });
    } else if (activeIndex < post.videos.length - 1) {
      swiperRef.current?.slideNext();
    }
  }, [activeIndex, post.videos.length, tContent]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      <ResumeModal
        isOpen={showResumeModal}
        onClose={() => setShowResumeModal(false)}
        onResume={() => {
          setShowResumeModal(false);
          setIsPaused(false);  // 재생 재개
          if (resumeData && swiperRef.current) {
            const targetIndex = post.videos.findIndex(v => v.sequence === resumeData.sequence);
            if (targetIndex !== -1) {
              swiperRef.current.slideTo(targetIndex);
              setActiveIndex(targetIndex);
              const url = new URL(window.location.href);
              url.searchParams.set('t', resumeData.timestamp.toString());
              window.history.replaceState({}, '', url);
            }
          }
        }}
        onStartOver={() => {
          setShowResumeModal(false);
          setResumeData(null);  // 재생 재개

        }}
        message="시청 기록이 있습니다!"
        imageUrl="/MS Logo emblem.svg"
        lastSequence={resumeData?.sequence || 1}
        lastTimestamp={resumeData?.timestamp || 0}
      />
      <div 
        className={cn(
          "fixed inset-0 bg-black overflow-hidden",
          isPwaMobile && "pwa-recommended-page"
        )}
        onMouseMove={updateButtonsVisibility}
        onTouchStart={updateButtonsVisibility}
      >

        {/* 상단 오버레이 - 제목과 재생순서 표시 */}
        {/* <div 
          className={cn(
            "absolute inset-x-0 top-0 z-10 bg-gradient-to-b from-black/70 to-transparent h-24 transition-opacity duration-300 pointer-events-none",
            showButtons ? "opacity-100" : "opacity-0"
          )}
        >
          <div className="p-4 text-white">
            <h1 className="text-lg font-semibold">11111</h1>
            <p className="text-sm opacity-80">
              {activeIndex + 1} / 12345
            </p>
          </div>
        </div> */}

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
          className="h-full w-full swiper-container"
          onSwiper={(swiper) => {
            // if (swiperRef.current) return;
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
          onBeforeTransitionStart={(swiper) => {
            console.log('beforeTransitionStart', {
              isBeginning: swiper.isBeginning,
              isEnd: swiper.isEnd,
              allowSlidePrev: swiper.allowSlidePrev,
              allowSlideNext: swiper.allowSlideNext
            });

            if (swiper.isBeginning && !swiper.allowSlidePrev) {
              toast({
                variant: "default",
                description: tContent('firstVideo'),
                duration: 1000,
              });
            }

            if (swiper.isEnd && !swiper.allowSlideNext) {
              toast({
                variant: "default",
                description: tContent('lastVideo'),
                duration: 1000,
              });
            }
          }}
          initialSlide={initialIndex}
          watchSlidesProgress={true}
          observer={true}
          observeParents={true}
        >
          {post.videos.map((video, index) => {
            const streamId = video.id;
            return (
              <SwiperSlide key={video.id} virtualIndex={index}>
                <div className={cn(
                  "w-full h-full flex items-center justify-center bg-black",
                  isPwaMobile ? "pwa-recommended-slide" : "pt-[48px] md:pt-[70px] pb-1"
                )}>
                  {/* <div className="relative w-[calc(100vh*16/9)] max-w-[640px] h-full md:pt-24 md:mb-8 pb-8 mb-8 pt-8"> */}
                  <div className={cn(
                    isPwaMobile
                      ? "relative w-full h-full mx-auto"
                      : "relative aspect-[9/16] h-full mx-auto"
                  )}>
                    <div className={cn(
                      "absolute inset-x-0 md:mb-8 z-10 transition-opacity duration-300",
                      isPwaMobile ? "top-[max(0.75rem,env(safe-area-inset-top))]" : "top-10",
                      showButtons ? "opacity-100" : "opacity-0"
                    )}>
                      <div className="pl-4 md:pl-4 pt-4 text-white flex items-center relative">
                        <div className="bg-gradient-to-r from-black/70 to-transparent px-4 py-2 rounded-lg">
                          <h1 className="text-sm md:text-lg text-slate-100 inline">{localizedTitle}</h1>
                          <h1 className="text-sm md:text-lg text-white pl-2 inline-block">EP.{activeIndex + 1}</h1>
                          <p className="text-xl font-semibold pl-2 inline-block relative top-[4px]">👀</p>
                        </div>
                      </div>
                    </div>
                    
                    <VideoPlayer
                      videoId={streamId}
                      postId={post.id}
                      sequence={video.sequence}
                      title={localizedTitle}
                      isActive={index === activeIndex && !showResumeModal}
                      onEnded={handleVideoEnd}
                      className={cn("w-full h-full", isPwaMobile && "object-contain")}
                      userLanguage={userLanguage}
                      initialTime={
                        // 1. 이어보기로 이동한 경우: resumeData의 시간 사용
                        index === activeIndex && resumeData?.sequence === video.sequence
                          ? resumeData.timestamp
                          : // 2. 기존 URL 파라미터 처리는 그대로 유지
                            index === initialIndex 
                              ? initialTime 
                              : 0
                      }
                      muted={isMuted}
                      isPremium={video.isPremium}
                    />

                    {index === activeIndex && (
                      <>
                        <PlayPermissionCheck
                          postId={post.id}
                          videoId={video.id}        // 실제 DB의 video.id
                          playOrder={video.sequence}
                          ageLimit={post.ageLimit}
                          isPremium={video.isPremium}
                          uploaderId={post.userId}
                          setIsActive={(active) => {
                            if (!active) setActiveIndex(-1);
                          }}
                          onPermissionCheck={(code) => {
                            switch (code) {
                              case 1:
                                setModalState({
                                  isOpen: true,
                                  message: tContent('loginRequired'),
                                  imageUrl: '/MS Logo emblem.svg',
                                  redirectUrl: '/login',
                                  buttonText: tContent('goLogin')
                                });
                                break;
                              case 2:
                                setShowAgeVerification(true);
                                break;
                              case 3:
                                setModalState({
                                  isOpen: true,
                                  message: tContent('premiumRequired'),
                                  imageUrl: '/MS Logo emblem.svg',
                                  redirectUrl: '/subscription',
                                  buttonText: tContent('goUse')
                                });
                                break;
                              case 4:
                                setModalState({
                                  isOpen: true,
                                  message: tContent('coinError'),
                                  imageUrl: '/MS Logo emblem.svg',
                                  redirectUrl: '/',
                                  buttonText: tContent('goHome')
                                });
                                break;
                            }
                          }}
                        />

                        {/* VideoControls 추가 */}
                        <div 
                          className={cn(
                            "z-10 transition-opacity duration-300",
                            isPwaMobile
                              ? "absolute right-2 bottom-[calc(env(safe-area-inset-bottom)+5.5rem)]"
                              : "absolute right-4 bottom-32 md:right-[-5.5rem] md:bottom-30",
                            showButtons ? "opacity-100" : "opacity-0"
                          )}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <VideoControls
                            postId={post.id}
                            initialBookmarkState={{
                              isBookmarkedByUser: false  // API로 실제 상태 가져오기
                            }}
                            initialLikeState={{
                              likes: 0,  // API로 실제 상태 가져오기
                              isLikedByUser: false
                            }}
                            hasNextVideo={index < post.videos.length - 1}
                            hasPrevVideo={index > 0}
                            onNavigate={(direction) => {
                              if (direction === 'next' && index < post.videos.length - 1) {
                                swiperRef.current?.slideNext();
                              } else if (direction === 'prev' && index > 0) {
                                swiperRef.current?.slidePrev();
                              }
                            }}
                            visible={showButtons}
                            videos={post.videos}
                            onMuteToggle={handleMuteToggle}
                            isMuted={isMuted}
                          />
                        </div>

                      </>
                    )}

                  </div>
                </div>
              </SwiperSlide>
            );
          })}
        </Swiper>
      </div>
      <AlertModal {...modalState} onClose={() => setModalState(prev => ({ ...prev, isOpen: false }))} />
      <AgeVerificationModal
        isOpen={showAgeVerification}
        onClose={() => setShowAgeVerification(false)}
        onVerified={() => {
          setShowAgeVerification(false);
          // 인증 성공 후 현재 비디오 다시 체크하도록 activeIndex 리셋
          const currentIndex = activeIndex;
          setActiveIndex(-1);
          setTimeout(() => setActiveIndex(currentIndex), 100);
        }}
      />
    </>
  );
}
