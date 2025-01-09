'use client';

import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import ky from '../../../lib/ky';
import FullScreenVideo from '../../../components/videos/FullScreenVideo';
import type { PostWithVideos } from '../../../lib/types';

// 추천 포스트를 가져오는 함수
const fetchRecommendedPosts = async () => {
  const response = await ky.get('/api/posts/recommended').json<PostWithVideos[]>();
  return response;
};

export default function VideoFeed() {
  const containerRef = useRef<HTMLDivElement>(null);

  // 포스트 데이터를 가져옵니다
  const { data: posts = [] } = useQuery({
    queryKey: ['posts', 'recommended'],
    queryFn: fetchRecommendedPosts,
  });

  // 컴포넌트 마운트 시 사용자 상호작용 시뮬레이션
  useEffect(() => {
    if (containerRef.current) {
      // 사용자 상호작용 시뮬레이션을 위한 이벤트 생성
      const simulateUserInteraction = () => {
        const interactionEvent = new MouseEvent('click', {
          view: window,
          bubbles: true,
          cancelable: true,
        });
        containerRef.current?.dispatchEvent(interactionEvent);
      };

      // 약간의 지연 후 실행 (컴포넌트가 완전히 마운트된 후)
      const timer = setTimeout(simulateUserInteraction, 100);
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <div ref={containerRef} className="relative min-h-screen w-full">
      <FullScreenVideo posts={posts} />
    </div>
  );
}
