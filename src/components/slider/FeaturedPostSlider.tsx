'use client';

import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay, Navigation, EffectCoverflow } from 'swiper/modules';
import Image from 'next/image';
import { PostData } from '@/lib/types';

import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import { useState } from 'react';
import PostModal from '../posts/PostModal';
import { getThumbnailUrl } from '@/lib/constants';
import Link from 'next/link';

interface FeaturedPostSliderProps {
  posts: PostData[];
  title?: string;
  viewAllHref?: string;
  sliderId: string;
}

const FeaturedPostSlider = ({ posts, title, viewAllHref, sliderId }: FeaturedPostSliderProps) => {
  const [hoveredIndex, setHoveredIndex] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<PostData | null>(null);

  const handleSlideClick = (post: PostData) => {
    setSelectedPost(post);
  };

  const handleCloseModal = () => {
    setSelectedPost(null);
  };

  if (posts.length === 0) {
    return null;
  }
  
  return (
    <div className="relative w-full h-[42vh] min-h-[400px] flex flex-col items-center">
      {/* 타이틀 섹션 */}
      {/* {title && (
        <div className="w-full flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">{title}</h2>
          {viewAllHref && (
            <Link href={viewAllHref} className="text-sm text-muted-foreground hover:text-primary">
              더보기
            </Link>
          )}
        </div>
      )} */}

      <div className="swiper-container-1 h-full w-full mb-8">
        <Swiper
          modules={[Pagination, Autoplay, Navigation, EffectCoverflow]}
          effect="coverflow"
          breakpoints={{
            420: {
              slidesPerView: 2.2,
            },
            640: {
              slidesPerView: 3.2,
            },
            1024: {
              slidesPerView: 4.2,
            },
          }}
          centeredSlides={true}
          loop={true}
          autoplay={{ delay: 5000, disableOnInteraction: false }}
          pagination={{
            clickable: true,
            el: '.pagination-container',
          }}
          navigation={false}
          spaceBetween={-80}
          coverflowEffect={{
            rotate: 0,
            stretch: 0,
            depth: 80,
            modifier: 6,
            slideShadows: false,
          }}
          className="h-full !px-[2%]"
        >
          {[...posts]
            .sort((a, b) => (b.priority || 0) - (a.priority || 0))
            .slice(0, 10)
            .map((post, index) => (
            <SwiperSlide
              key={`${sliderId}-${index}`}
              className="relative z-0 aspect-[2/3]"
              style={{
                width: 'calc(33.333% - 20px)',
                height: '100%',
                margin: '0 auto',
              }}
            >
              {({ isActive, isVisible, isPrev, isNext }) => (
                <div
                  className={`relative h-full transition-transform duration-300 mx-auto rounded-lg group ${
                    isActive ? 'shadow-lg' : ''
                  }`}
                  style={{
                    position: 'relative',
                    background: isActive
                      ? 'linear-gradient(to bottom, rgba(255, 255, 255, 0.3), transparent)'
                      : isVisible
                      ? 'linear-gradient(to bottom, rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.3))'
                      : '',
                    boxShadow: 'none',
                    aspectRatio: '2/3',
                    borderRadius: '15px',
                    overflow: 'hidden',
                    minWidth: '280px',
                    visibility: isVisible ? 'visible' : 'hidden',
                  }}
                  onMouseEnter={() => setHoveredIndex(post.id)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  onClick={() => handleSlideClick(post)}
                >
                  <div className="relative w-full h-full rounded-lg overflow-hidden">
                    <Image
                      src={getThumbnailUrl(post.thumbnailId)}
                      alt={`타이틀 ${post.title || ''} - ${post.categories || ''} 컨텐츠의 대표 이미지`}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className={`object-cover transition-transform duration-300 ${
                        hoveredIndex === post.id ? 'scale-105' : 'scale-100'
                      }`}
                      priority
                    />
                    {/* 비활성 슬라이드에 대한 어두운 오버레이 */}
                    {!isActive && isVisible && (
                      <div 
                      className={`absolute inset-0 transition-opacity duration-300 ${
                        isPrev || isNext
                          ? 'bg-black/40'  // 중앙 바로 옆 슬라이드
                          : 'bg-black/85'   // 더 멀리 있는 슬라이드
                      }`}
                    />
                    )}
                  </div>
                  {isActive && hoveredIndex === post.id && (
                    <div className="absolute bottom-0 left-0 w-full transition-opacity duration-300">
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
                      <div className="relative p-4 flex items-center justify-center h-full">
                        <h3 className="text-xl font-bold text-white mb-2">
                          {post.title}
                        </h3>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
      <div className="pagination-container w-full flex justify-center" />
      {selectedPost && (
        <PostModal
          post={selectedPost}
          handleClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default FeaturedPostSlider;
