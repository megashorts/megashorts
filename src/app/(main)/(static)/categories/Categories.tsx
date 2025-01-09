"use client";

import { useEffect, useState } from "react";
import { CategoryType } from "@prisma/client";
import { PostData, PostsPage } from "@/lib/types";
import PostCard from "@/components/posts/PostCard";
import PostsLoadingSkeleton from "@/components/posts/PostsLoadingSkeleton";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import InfiniteScrollContainer from "@/components/InfiniteScrollContainer";
import kyInstance from "@/lib/ky";

interface CategoriesProps {
  category: CategoryType;
  initialPosts: PostData[];
}

export default function Categories({ category, initialPosts }: CategoriesProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    console.log('[Client] Component mounted, initialPosts:', initialPosts.length);
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [initialPosts.length]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: ["post-feed", "category", category],
    queryFn: ({ pageParam }) =>
      kyInstance
        .get(
          "/api/posts/by-category",
          { 
            searchParams: new URLSearchParams({
              ...(pageParam ? { cursor: pageParam } : {}),
              category: category.toString(),
              isMobile: String(isMobile),
            })
          }
        )
        .json<PostsPage>(),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialData: {
      pages: [{
        posts: initialPosts,
        nextCursor: initialPosts.length === 20 ? initialPosts[19].id : null
      }],
      pageParams: [null]
    },
    staleTime: Infinity,  // 데이터를 항상 fresh하게 유지
    gcTime: 24 * 60 * 60 * 1000,  // 캐시 유지 시간 24시간
  });

  const allPosts = data?.pages.flatMap((page) => page.posts) || initialPosts;

  if (isFetching && !data?.pages?.length && !initialPosts.length) {
    return <PostsLoadingSkeleton />;
  }

  return (
    <InfiniteScrollContainer
      className="space-y-5"
      onBottomReached={() => hasNextPage && !isFetching && fetchNextPage()}
    >
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {allPosts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
      
      {isFetchingNextPage && (
        <div className="flex justify-center p-4">
          <Loader2 className="animate-spin" />
        </div>
      )}
      
      {!hasNextPage && allPosts.length > 0 && (
        <p className="text-center text-muted-foreground py-4">
          모든 컨텐츠를 불러왔습니다.
        </p>
      )}
    </InfiniteScrollContainer>
  );
}