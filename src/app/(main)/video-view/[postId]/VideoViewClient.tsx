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
import { useSession } from '@/components/SessionProvider';
import { cn } from '@/lib/utils';
import VideoControls from '@/components/videos/VideoControls';
import { useSearchParams } from 'next/navigation';
import { videoDB } from '@/lib/indexedDB';
import { ResumeModal } from '@/components/ui/ResumeModal';

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
    videos: {
      id: string;
      url: string;
      sequence: number;
      isPremium: boolean;
    }[];
  };
  initialSequence: number;
  initialTime: number;
}

export function VideoViewClient({ post, initialSequence, initialTime }: VideoViewClientProps) {
  // 이어보기 파라미터
  const searchParams = useSearchParams();
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
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const checkResumePoint = async () => {
      try {
        // URL의 시간 파라미터 확인
        const timeParam = searchParams.get('t');
        
        // IndexedDB에서 시청 기록 확인
        const lastView = await videoDB.getLastView(post.id);
        
        if (lastView && lastView.sequence >= initialSequence && lastView.sequence > 1) {  
          // 시청 기록이 있고 현재 시청하려는 순서보다 크거나 같은 경우 모달 표시
          setResumeData({
            sequence: lastView.sequence,
            timestamp: lastView.timestamp
          });
          setShowResumeModal(true);
        } else if (timeParam) {
          // 시청 기록은 없지만 URL에 시간값이 있는 경우
          const time = parseInt(timeParam, 10);
          if (!isNaN(time)) {
            setActiveIndex(0); // 첫 번째 영상으로 설정
            const video = document.querySelector('video');
            if (video) {
              video.currentTime = time;
            }
          }
        }
      } catch (error) {
        console.error('Failed to check resume point:', error);
      }
    };
  
    checkResumePoint();
  }, [post.id]);

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
      streamId: post.videos[swiper.activeIndex].url.split('/')[3]
    });
    setActiveIndex(swiper.activeIndex);
  }, [post.videos]);

  const handleVideoEnd = useCallback(() => {
    if (activeIndex === post.videos.length - 1) {
      setModalState({
        isOpen: true,
        message: '시청완료! 다음 추천컨텐츠!\n\n관리자 로직입력시 자동생성영역',
        imageUrl: '/MS Logo emblem.svg',
        redirectUrl: `/categories/recent`,
        buttonText: '최신작 보러가기'
      });
    } else if (activeIndex < post.videos.length - 1) {
      swiperRef.current?.slideNext();
    }
  }, [activeIndex, post.videos.length]);

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
          if (resumeData && swiperRef.current) {
            // 브라우저에 저장된 순서의 슬라이드로 이동
            const targetIndex = post.videos.findIndex(v => v.sequence === resumeData.sequence);
            if (targetIndex !== -1) {
              // 저장된 순서로 슬라이드 이동
              swiperRef.current.slideTo(targetIndex);
              setActiveIndex(targetIndex);
              
              // 기존 initialTime prop 활용을 위해 URL 파라미터 추가
              const url = new URL(window.location.href);
              url.searchParams.set('t', resumeData.timestamp.toString());
              window.history.replaceState({}, '', url);
              
            }
          }
        }}
        onStartOver={() => {
          // setActiveIndex(0);
          setShowResumeModal(false);
        }}
        message="시청 기록이 있습니다!"
        imageUrl="/MS Logo emblem.svg"
        lastSequence={resumeData?.sequence || 1}
        lastTimestamp={resumeData?.timestamp || 0}
      />
      <div 
        className="fixed inset-0 bg-black overflow-hidden"
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
                description: '처음 동영상입니다.',
                duration: 1000,
              });
            }

            if (swiper.isEnd && !swiper.allowSlideNext) {
              toast({
                variant: "default",
                description: '마지막 동영상입니다.',
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
            const streamId = video.url.split('/')[3];
            return (
              <SwiperSlide key={video.id} virtualIndex={index}>
                <div className="w-full h-full flex items-center justify-center bg-black pt-[48px] md:pt-[70px] pb-1">
                  {/* <div className="relative w-[calc(100vh*16/9)] max-w-[640px] h-full md:pt-24 md:mb-8 pb-8 mb-8 pt-8"> */}
                  <div className="relative aspect-[9/16] h-full mx-auto">
                    <div className={cn(
                      "absolute inset-x-0 top-10 md:mb-8 z-10 transition-opacity duration-300",
                      showButtons ? "opacity-100" : "opacity-0"
                    )}>
                      <div className="pl-4 md:pl-4 pt-4 text-white flex items-center relative">
                        <div className="bg-gradient-to-r from-black/70 to-transparent px-4 py-2 rounded-lg">
                          <h1 className="text-sm md:text-lg text-slate-100 inline">{post.title}</h1>
                          <h1 className="text-sm md:text-lg text-white pl-2 inline-block">EP.{activeIndex + 1}</h1>
                          <p className="text-xl font-semibold pl-2 inline-block relative top-[4px]">👀</p>
                        </div>
                      </div>
                    </div>
                    
                    <VideoPlayer
                      videoId={streamId}
                      postId={post.id}
                      sequence={video.sequence}
                      isActive={index === activeIndex}
                      onEnded={handleVideoEnd}
                      className="w-full h-full"
                      userLanguage="KOREAN"
                      initialTime={
                        // 1. 이어보기로 이동한 경우: resumeData의 시간 사용
                        index === activeIndex && resumeData?.sequence === video.sequence
                          ? resumeData.timestamp
                          : // 2. 기존 URL 파라미터 처리는 그대로 유지
                            index === initialIndex 
                              ? initialTime 
                              : 0
                      }
                    />

                    {index === activeIndex && (
                      <>
                        <PlayPermissionCheck
                          postId={post.id}
                          videoId={video.id}        // 실제 DB의 video.id
                          playOrder={video.sequence}
                          ageLimit={post.ageLimit}
                          isPremium={video.isPremium}
                          setIsActive={(active) => {
                            if (!active) setActiveIndex(-1);
                          }}
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
                                  // redirectUrl: `/usermenu/users/${user?.username}`,
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

                        {/* VideoControls 추가 */}
                        <div 
                          className={cn(
                            "absolute right-4 bottom-32 md:right-[-5.5rem] md:bottom-30 z-10 transition-opacity duration-300",
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
    </>
  );
}


// 'use client';

// import { useState, useRef, useCallback } from 'react';
// import { Swiper, SwiperSlide } from 'swiper/react';
// import { Virtual, Mousewheel } from 'swiper/modules';
// import type { Swiper as SwiperType } from 'swiper';
// import VideoPlayer from '@/components/videos/VideoPlayer';
// import 'swiper/css';
// import 'swiper/css/virtual';
// import { toast } from '@/components/ui/use-toast';
// import { AlertModal } from '@/components/ui/AlertModal';
// import PlayPermissionCheck from '@/components/videos/PlayPermissionCheck';
// import { useSession } from '@/components/SessionProvider';
// import { cn } from '@/lib/utils';
// import VideoControls from '@/components/videos/VideoControls';

// interface ModalState {
//   isOpen: boolean;
//   message: string;
//   imageUrl: string;
//   redirectUrl?: string;
//   buttonText?: string;
// }

// interface VideoViewClientProps {
//   post: {
//     id: string;
//     ageLimit: number;
//     title: string | null;
//     videos: {
//       id: string;
//       url: string;
//       sequence: number;
//       isPremium: boolean;
//     }[];
//   };
//   initialSequence: number;
// }

// export function VideoViewClient({ post, initialSequence }: VideoViewClientProps) {
//   const initialIndex = Math.max(0, post.videos.findIndex(v => v.sequence === initialSequence));
//   const [activeIndex, setActiveIndex] = useState(initialIndex);
//   const swiperRef = useRef<SwiperType>();
//   const [modalState, setModalState] = useState<ModalState>({
//     isOpen: false,
//     message: '',
//     imageUrl: '',
//   });
//   const [showButtons, setShowButtons] = useState(false);
//   const timeoutRef = useRef<NodeJS.Timeout>();

//   // 마우스 움직임 감지 핸들러 추가
//   const updateButtonsVisibility = useCallback(() => {
//     setShowButtons(true);
//     if (timeoutRef.current) {
//       clearTimeout(timeoutRef.current);
//     }
//     timeoutRef.current = setTimeout(() => {
//       setShowButtons(false);
//     }, 3000);
//   }, []);

//   const handleSlideChange = useCallback((swiper: SwiperType) => {
//     console.log('Slide changed:', {
//       newIndex: swiper.activeIndex,
//       video: post.videos[swiper.activeIndex],
//       sequence: post.videos[swiper.activeIndex].sequence,
//       streamId: post.videos[swiper.activeIndex].url.split('/')[3]
//     });
//     setActiveIndex(swiper.activeIndex);
//   }, [post.videos]);

//   const handleVideoEnd = useCallback(() => {
//     if (activeIndex === post.videos.length - 1) {
//       setModalState({
//         isOpen: true,
//         message: '시청완료! 다음 추천컨텐츠!\n\n관리자 로직입력시 자동생성영역',
//         imageUrl: '/MS Logo emblem.svg',
//         redirectUrl: `/categories/recent`,
//         buttonText: '최신작 보러가기'
//       });
//     } else if (activeIndex < post.videos.length - 1) {
//       swiperRef.current?.slideNext();
//     }
//   }, [activeIndex, post.videos.length]);

//   return (
//     <>
//       <div 
//         className="fixed inset-0 bg-black overflow-hidden"
//         onMouseMove={updateButtonsVisibility}
//         onTouchStart={updateButtonsVisibility}
//       >

//         {/* 상단 오버레이 - 제목과 재생순서 표시 */}
//         {/* <div 
//           className={cn(
//             "absolute inset-x-0 top-0 z-10 bg-gradient-to-b from-black/70 to-transparent h-24 transition-opacity duration-300",
//             showButtons ? "opacity-100" : "opacity-0"
//           )}
//         >
//           <div className="p-4 text-white">
//             <h1 className="text-lg font-semibold">11111</h1>
//             <p className="text-sm opacity-80">
//               {activeIndex + 1} / 12345
//             </p>
//           </div>
//         </div> */}

//         <Swiper
//           modules={[Virtual, Mousewheel]}
//           direction="vertical"
//           slidesPerView={1}
//           spaceBetween={0}
//           speed={400}
//           mousewheel={{
//             enabled: true,
//             sensitivity: 1,
//             thresholdDelta: 20,
//             forceToAxis: true,
//             releaseOnEdges: false,
//             eventsTarget: '.swiper-container'
//           }}
//           virtual
//           className="h-full w-full swiper-container"
//           onSwiper={(swiper) => {
//             // if (swiperRef.current) return;
//             console.log('onSwiper called');
//             swiperRef.current = swiper;
//           }}
//           onSlideChange={handleSlideChange}
//           onReachBeginning={(swiper) => {
//             console.log('reachBeginning');
//             swiper.allowSlidePrev = false;
//           }}
//           onReachEnd={(swiper) => {
//             console.log('reachEnd');
//             swiper.allowSlideNext = false;
//           }}
//           onFromEdge={(swiper) => {
//             console.log('fromEdge');
//             swiper.allowSlidePrev = true;
//             swiper.allowSlideNext = true;
//           }}
//           onBeforeTransitionStart={(swiper) => {
//             console.log('beforeTransitionStart', {
//               isBeginning: swiper.isBeginning,
//               isEnd: swiper.isEnd,
//               allowSlidePrev: swiper.allowSlidePrev,
//               allowSlideNext: swiper.allowSlideNext
//             });

//             if (swiper.isBeginning && !swiper.allowSlidePrev) {
//               toast({
//                 description: '처음 동영상입니다.'
//               });
//             }

//             if (swiper.isEnd && !swiper.allowSlideNext) {
//               toast({
//                 description: '마지막 동영상입니다.'
//               });
//             }
//           }}
//           initialSlide={initialIndex}
//           watchSlidesProgress={true}
//           observer={true}
//           observeParents={true}
//         >
//           {post.videos.map((video, index) => {
//             const streamId = video.url.split('/')[3];
//             return (
//               <SwiperSlide key={video.id} virtualIndex={index}>
//                 <div className="w-full h-full flex items-center justify-center bg-black">
//                   <div className="relative w-[calc(100vh*16/9)] max-w-[640px] h-full md:pt-24 md:mb-8 pb-8 mb-8 pt-8">
                    
//                     <div 
//                       // className={cn(
//                       //   "absolute inset-x-0 top-0 h-full z-10 bg-gradient-to-b from-black/70 to-transparent h-24 transition-opacity duration-300",
//                       //   showButtons ? "opacity-100" : "opacity-0"
//                       // )}
//                       className={cn(
//                         "absolute inset-x-0 top-0 md:pt-24 md:mb-8 pb-8 mb-8 pt-20 z-10 bg-gradient-to-b from-black/70 to-transparent h-24 transition-opacity duration-300",
//                         showButtons ? "opacity-100" : "opacity-0"
//                       )}
//                     >
//                       <div className="pl-5 md:pl-10 pt-4 text-white flex items-center">
//                         <h1 className="text-sm md:text-lg text-slate-100">{post.title}</h1>
//                         <h1 className="text-sm md:text-lg text-white pl-2">EP.{activeIndex + 1}</h1>
//                         <p className="text-xl font-semibold relative top-[3px] pl-2">👀</p>
//                       </div>
//                     </div>
                    
//                     <VideoPlayer
//                       videoId={streamId}
//                       postId={post.id}
//                       sequence={video.sequence}
//                       isActive={index === activeIndex}
//                       onEnded={handleVideoEnd}
//                       className="w-full h-full"
//                     />

//                     {index === activeIndex && (
//                       <>
//                         <PlayPermissionCheck
//                           postId={post.id}
//                           videoId={video.id}        // 실제 DB의 video.id
//                           playOrder={video.sequence}
//                           ageLimit={post.ageLimit}
//                           isPremium={video.isPremium}
//                           setIsActive={(active) => {
//                             if (!active) setActiveIndex(-1);
//                           }}
//                           onPermissionCheck={(code) => {
//                             switch (code) {
//                               case 1:
//                                 setModalState({
//                                   isOpen: true,
//                                   message: '로그인이 필요한 컨텐츠입니다.',
//                                   imageUrl: '/MS Logo emblem.svg',
//                                   redirectUrl: '/login',
//                                   buttonText: '로그인 이동'
//                                 });
//                                 break;
//                               case 2:
//                                 setModalState({
//                                   isOpen: true,
//                                   message: '성인인증이 필요한 컨텐츠입니다.',
//                                   imageUrl: '/MS Logo emblem.svg',
//                                   // redirectUrl: `/usermenu/users/${user?.username}`,
//                                   redirectUrl: '/',
//                                   buttonText: '홈으로 이동'
//                                 });
//                                 break;
//                               case 3:
//                                 setModalState({
//                                   isOpen: true,
//                                   message: '프리미엄 컨텐츠입니다.\n구독 또는 코인으로 이용하세요',
//                                   imageUrl: '/MS Logo emblem.svg',
//                                   redirectUrl: '/subscription',
//                                   buttonText: '이용하러 가기'
//                                 });
//                                 break;
//                               case 4:
//                                 setModalState({
//                                   isOpen: true,
//                                   message: '코인이용 에러입니다.\n다시 시도해 주세요',
//                                   imageUrl: '/MS Logo emblem.svg',
//                                   redirectUrl: '/',
//                                   buttonText: '홈으로 이동'
//                                 });
//                                 break;
//                             }
//                           }}
//                         />

//                         {/* VideoControls 추가 */}
//                         <div 
//                           className={cn(
//                             "absolute right-4 bottom-20 md:right-[-5.5rem] md:bottom-30 z-10 transition-opacity duration-300",
//                             showButtons ? "opacity-100" : "opacity-0"
//                           )}
//                         >
//                           <VideoControls
//                             postId={post.id}
//                             initialBookmarkState={{
//                               isBookmarkedByUser: false  // API로 실제 상태 가져오기
//                             }}
//                             initialLikeState={{
//                               likes: 0,  // API로 실제 상태 가져오기
//                               isLikedByUser: false
//                             }}
//                             hasNextVideo={index < post.videos.length - 1}
//                             hasPrevVideo={index > 0}
//                             onNavigate={(direction) => {
//                               if (direction === 'next' && index < post.videos.length - 1) {
//                                 swiperRef.current?.slideNext();
//                               } else if (direction === 'prev' && index > 0) {
//                                 swiperRef.current?.slidePrev();
//                               }
//                             }}
//                             visible={showButtons}
//                           />
//                         </div>

//                       </>
//                     )}

//                   </div>
//                 </div>
//               </SwiperSlide>
//             );
//           })}
//         </Swiper>
//       </div>
//       <AlertModal {...modalState} onClose={() => setModalState(prev => ({ ...prev, isOpen: false }))} />
//     </>
//   );
// }