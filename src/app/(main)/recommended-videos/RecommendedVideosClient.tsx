"use client";

import { useState, useRef, useCallback } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Virtual, Mousewheel } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import VideoPlayer from '@/components/videos/VideoPlayer';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import VideoControls from '@/components/videos/VideoControls';
import 'swiper/css';
import 'swiper/css/virtual';

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

export function RecommendedVideosClient({ posts }: RecommendedVideosClientProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const swiperRef = useRef<SwiperType>();
  const [showButtons, setShowButtons] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const [currentTime, setCurrentTime] = useState(0);

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

  const handleSlideChange = useCallback((swiper: SwiperType) => {
    console.log('Slide changed:', {
      newIndex: swiper.activeIndex,
      video: posts[swiper.activeIndex].videos[0],
      sequence: posts[swiper.activeIndex].videos[0].sequence,
      streamId: posts[swiper.activeIndex].videos[0].url.split('/')[3]
    });
    setActiveIndex(swiper.activeIndex);
  }, [posts]);

  const handleVideoEnd = useCallback(() => {
    swiperRef.current?.slideNext();
  }, []);

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
        {posts.map((post, index) => {
          const video = post.videos[0];
          const streamId = video.url.split('/')[3];
          return (
            <SwiperSlide key={post.id} virtualIndex={index}>
              <div className="w-full h-full flex items-center justify-center bg-black">
                <div className="relative aspect-[9/16] h-full md:pt-24 md:mb-8 pt-4">
                  <div 
                    className={cn(
                      "absolute inset-x-0 top-28 md:mb-8 z-10 transition-opacity duration-300",
                      showButtons ? "opacity-100" : "opacity-0"
                    )}
                  >
                    <div className="pl-8 md:pl-12 pt-4 text-white flex items-center relative">
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
                      visible={showButtons} videos={[]}                    />
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