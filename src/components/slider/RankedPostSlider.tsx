'use client';

import { useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode, Navigation } from 'swiper/modules';
import Image from 'next/image';
import Link from 'next/link';
import { PostData } from '@/lib/types';
// import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import 'swiper/css';
import 'swiper/css/free-mode';
import 'swiper/css/navigation';
import PostModal from '../posts/PostModal';
import { getThumbnailUrl } from '@/lib/constants';


interface RankedPostSliderProps {
  posts: PostData[];
  title: string;
  viewAllHref: string;
  sliderId: string;
}

const RankedPostSlider = ({ posts, title, sliderId }: RankedPostSliderProps) => {
  // const router = useRouter();
  const [isBeginning, setIsBeginning] = useState(true);
  const [isEnd, setIsEnd] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
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

  // const sliderId = `slider-${title.replace(/\s+/g, '-').toLowerCase()}`;


  return (
    <div className="relative w-full select-none">
      {/* Section Title with View All Link */}
      <div className="flex justify-between items-center mb-4 md:px-4">
        <h2 className="text-xl font-bold text-white">{title}</h2>
        {/* <Link 
          href={viewAllHref}
          className="text-sm text-gray-300 hover:text-white transition-colors duration-200"
        >
          전체보기
        </Link> */}
      </div>

      {/* Slider Container */}
      <div className="swiper-container-2 group relative">
        <Swiper
          modules={[FreeMode, Navigation]}
          breakpoints={{
            320: {
              slidesPerView: 2.4,
              spaceBetween: 12
            },
            768: {
              slidesPerView: 5.6,
              spaceBetween: 16
            },
            1024: {
              slidesPerView: 5.6,
              spaceBetween: 20
            },
            1536: {
              slidesPerView: 5.8,
              spaceBetween: 24
            }
          }}
          style={{
            height: '100%'  // Swiper 컨테이너 높이 설정
          }}
          freeMode={{
            enabled: true,
            sticky: true,
            momentumBounce: false
          }}
          loop={false}  // loop 비활성화
          centeredSlides={false}
          navigation={{
            nextEl: `.swiper-button-next-${sliderId}`,
            prevEl: `.swiper-button-prev-${sliderId}`,
          }}
          onSlideChange={(swiper) => {
            setIsBeginning(swiper.isBeginning);
            setIsEnd(swiper.isEnd);
          }}
          className={sliderId}
        >
          {posts.map((post, index) => (
            <SwiperSlide
              key={post.id}
              className="!w-[calc(100%/3.5+40px)] md:!w-[calc(100%/5.5+40px)] lg:!w-[calc(100%/8.5+40px)] xl:!w-[calc(100%/8.5+40px)]"  // slidesPerView 값과 맞춤
            >
              <div className="relative pl-[35px]">
                <div 
                  className="absolute left-4 sm:left-2 bottom-[-10px] z-[1]"
                >
                  <span 
                    className="text-[70px] leading-[90px] md:text-[100px] md:leading-[110px] font-bold"
                    style={{ 
                      color: '#141414',
                      WebkitTextStroke: '2px rgba(211, 211, 211, 1)',
                      textShadow: '3px 3px 5px rgba(128,128,128,0.9)',
                      // fontFamily: 'Arial, sans-serif',
                      fontWeight: 900
                    }}
                  >
                    {index + 1}
                  </span>
                </div>
                <div
                  className="relative aspect-[2/3] rounded-md overflow-hidden cursor-pointer group/item"  // scale-90 추가하여 크기 10% 감소
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  onClick={() => handleSlideClick(post)}
                >
                  <Image
                    src={getThumbnailUrl(post.thumbnailId)}
                    alt={`타이틀 ${post.title || ''} - ${post.categories || ''} 컨텐츠의 대표 이미지`}
                    fill
                    className="object-cover transition-transform duration-300 group-hover/item:scale-105"
                    sizes="(max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                    priority
                  />
                  
                  {hoveredIndex === index && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <h3 className="text-sm font-bold text-white mb-1 justify-center">{post.title}</h3>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* <button 
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
        </button> */}
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

export default RankedPostSlider;
