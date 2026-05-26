"use client";

import PostCard from "@/components/posts/PostCard";
import PostsLoadingSkeleton from "@/components/posts/PostsLoadingSkeleton";
import kyInstance from "@/lib/ky";
import { PostsPage } from "@/lib/types";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useIsMobile } from "@/hooks/use-mobile";
import { Loader2 } from "lucide-react";
import InfiniteScrollContainer from "@/components/InfiniteScrollContainer";
import PostGrid from "@/components/PostGrid";
import { useTranslations } from "next-intl";

interface YourPostsProps {
  status: "PUBLISHED" | "DRAFT";
}

export default function YourPosts({ status }: YourPostsProps) {
  const isMobile = useIsMobile();
  const tUserMenu = useTranslations('UserMenu');

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status: queryStatus,
  } = useInfiniteQuery({
    queryKey: ["your-posts", status],
    queryFn: ({ pageParam }) =>
      kyInstance
        .get(
          "/api/posts/for-you",
          { 
            searchParams: new URLSearchParams({
              ...(pageParam ? { cursor: pageParam } : {}),
              status,
              isMobile: String(isMobile),
            })
          }
        )
        .json<PostsPage>(),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  const posts = data?.pages.flatMap(page => page.posts) || [];

  if (queryStatus === "pending") {
    return <PostsLoadingSkeleton />;
  }

  if (queryStatus === "success" && !posts.length) {
    return (
      <p className="text-center text-muted-foreground">
        {status === "PUBLISHED" 
          ? tUserMenu('emptyPublished')
          : tUserMenu('emptyDraft')}
      </p>
    );
  }

  if (queryStatus === "error") {
    return (
      <p className="text-center text-destructive">
        {tUserMenu('loadError')}
      </p>
    );
  }

  return (
    <InfiniteScrollContainer
      className="space-y-5"
      onBottomReached={() => hasNextPage && !isFetching && fetchNextPage()}
    >
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>

      {/* <PostGrid 
        initialPosts={[]}
        apiEndpoint="/api/posts/for-you"
      /> */}
      
      {isFetchingNextPage && (
        <div className="flex justify-center p-4">
          <Loader2 className="animate-spin" />
        </div>
      )}
      
      {!hasNextPage && posts.length > 0 && (
        <p className="text-center text-muted-foreground py-4">
          {tUserMenu('allLoaded')}
        </p>
      )}
    </InfiniteScrollContainer>
  );
}
