'use client';

import { useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode, Navigation } from 'swiper/modules';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CategoryType } from '@prisma/client';
import 'swiper/css';
import 'swiper/css/free-mode';
import 'swiper/css/navigation';
import { PostData } from '@/lib/types';
import PostModal from '../posts/PostModal';

interface PostSliderProps {
  posts: PostData[];
  title: string;
  category: CategoryType | null;
  viewAllHref: string;
  sliderId: string;
}

const PostSlider = ({ posts, title, category, viewAllHref, sliderId }: PostSliderProps) => {
  const filteredPosts = category 
    ? posts.filter(post => post.categories?.includes(category))
    : posts;
  const [isBeginning, setIsBeginning] = useState(true);
  const [isEnd, setIsEnd] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [selectedPost, setSelectedPost] = useState<PostData | null>(null);

  // 화면 크기별 슬라이드 수
  // const getSlidesPerView = () => {
  //   if (typeof window === 'undefined') return 3;
  //   if (window.innerWidth >= 1536) return 7.2;  // xl
  //   if (window.innerWidth >= 1024) return 7.2;  // lg
  //   if (window.innerWidth >= 768) return 5.2;   // md
  //   return 3.2;                               // 모바일: 살짝 더 작게
  // };

  // const slidesPerView = getSlidesPerView();
  // const shouldEnableSwiper = filteredPosts.length >= slidesPerView;
  const shouldEnableSwiper = filteredPosts.length > 3;

  const handleSlideClick = (post: PostData) => {
    setSelectedPost(post);
  };

  const handleCloseModal = () => {
    setSelectedPost(null);
  };

  if (filteredPosts.length === 0) {
    return null;
  }

  return (
    <div className="relative w-full select-none">
      <div className="flex justify-between items-center mb-4 md:px-4">
        <h2 className="text-xl font-bold text-white">{title}</h2>
        <Link 
          href={viewAllHref}
          className="text-sm text-gray-300 hover:text-white transition-colors duration-200"
        >
          전체보기
        </Link>
      </div>

      <div className="swiper-container-2 group relative">
        <Swiper
          modules={[FreeMode, Navigation]}
          // slidesPerView={slidesPerView}
          breakpoints={{
            320: {
              slidesPerView: 3.2,
              spaceBetween: 12
            },
            768: {
              slidesPerView: 5.2,
              spaceBetween: 16
            },
            1024: {
              slidesPerView: 7.2,
              spaceBetween: 20
            },
            1536: {
              slidesPerView: 7.2,
              spaceBetween: 24
            }
          }}
          // spaceBetween={12}
          loop={false}  // loop 비활성화
          centeredSlides={false}
          freeMode={{
            enabled: shouldEnableSwiper,
            sticky: true,
            momentumBounce: false
          }}
          allowTouchMove={shouldEnableSwiper}
          navigation={{
            nextEl: `.swiper-button-next-${sliderId}`,
            prevEl: `.swiper-button-prev-${sliderId}`,
            enabled: shouldEnableSwiper
          }}
          onSlideChange={(swiper) => {
            setIsBeginning(swiper.isBeginning);
            setIsEnd(swiper.isEnd);
          }}
          className={sliderId}
        >
          {filteredPosts.map((post, index) => (
            <SwiperSlide
              key={post.id}
              // className="!opacity-100"
              // className="!w-[calc(100%/3.6)] md:!w-[calc(100%/5.6)] lg:!w-[calc(100%/6.2)] xl:!w-[calc(100%/7.8)]"
              // style={{
              //   width: `${100/slidesPerView}%`,
              //   maxWidth: window?.innerWidth >= 1024 ? '200px' : 'none'  // 데스크탑: 200px로 증가
              // }}
            >
              <div
                className="relative aspect-[2/3] rounded-md overflow-hidden cursor-pointer group/item"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => handleSlideClick(post)}
              >
                <Image
                  src={post.thumbnailUrl || '/placeholder.jpg'}
                  alt={post.title || ''}
                  fill
                  className="object-cover transition-all duration-300 group-hover/item:scale-105"
                  sizes="(max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                  priority
                />
                
                {hoveredIndex === index && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
                    <div className="absolute bottom-0 left-0 right-0 p-4 ">
                      <h3 className="text-sm font-bold text-white mb-1 justify-center">{post.title}</h3>
                    </div>
                  </div>
                )}
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* {shouldEnableSwiper && (
          <>
            <button 
              className={`swiper-button-prev-${sliderId} absolute left-0 top-0 z-10 h-full w-12 bg-black/30
                opacity-0 transition-opacity duration-200 group-hover:opacity-100 disabled:opacity-0
                flex items-center justify-center ${isBeginning ? 'hidden' : ''}`}
            >
              <ChevronLeft className="w-8 h-8 text-white" />
            </button>
            <button 
              className={`swiper-button-next-${sliderId} absolute right-0 top-0 z-10 h-full w-12 bg-black/30
                opacity-0 transition-opacity duration-200 group-hover:opacity-100 disabled:opacity-0
                flex items-center justify-center ${isEnd ? 'hidden' : ''}`}
            >
              <ChevronRight className="w-8 h-8 text-white" />
            </button>
          </>
        )} */}
      </div>

      {selectedPost && (
        <PostModal
          post={selectedPost}
          handleClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default PostSlider;