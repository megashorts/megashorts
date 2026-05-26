"use client";

import Image from "next/image";
import { useSession } from "@/components/SessionProvider";
import PostCard from "@/components/posts/PostCard";
import PostsLoadingSkeleton from "@/components/posts/PostsLoadingSkeleton";
import { useInfiniteQuery } from "@tanstack/react-query";
import kyInstance from "@/lib/ky";
import { PostsPage } from "@/lib/types";
import { videoDB } from "@/lib/indexedDB";
import InfiniteScrollContainer from "@/components/InfiniteScrollContainer";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

export default function WatchingContent() {
  const { user } = useSession();
  const tUserMenu = useTranslations('UserMenu');

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status
  } = useInfiniteQuery({
    queryKey: ["watching-posts"],
    queryFn: async ({ pageParam = 0 }) => {
      const ids = await videoDB.getWatchingPostIds();
      const currentIds = ids.slice(pageParam, pageParam + 20);
      
      if (!currentIds.length) {
        return { posts: [], nextCursor: null };
      }

      return kyInstance
        .get('/api/videos/watching', {
          searchParams: { ids: currentIds.join(',') }
        })
        .json<PostsPage>();
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) => {
      if (!lastPage.posts.length) return null;
      return pages.length * 20;
    },
    enabled: !!user
  });

  const posts = data?.pages.flatMap(page => page.posts) || [];

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-20">
        <div className="relative w-24 h-24 mb-4">
          <Image
            src="/MS Logo emblem.svg"
            alt="MS Logo"
            fill
            className="object-contain opacity-50"
          />
        </div>
        <p className="text-lg text-muted-foreground text-center font-medium">
          {tUserMenu('loginRequiredMenu')}
        </p>
      </div>
    );
  }

  if (status === "pending") {
    return <PostsLoadingSkeleton />;
  }

  if (status === "success" && !posts.length) {
    return (
      <p className="text-center text-muted-foreground mt-8">
        {tUserMenu('emptyWatching')}
      </p>
    );
  }

  if (status === "error") {
    return (
      <p className="text-center text-destructive mt-8">
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
