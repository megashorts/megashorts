"use client";

import InfiniteScrollContainer from "@/components/InfiniteScrollContainer";
import PostCard from "@/components/posts/PostCard";
import PostsLoadingSkeleton from "@/components/posts/PostsLoadingSkeleton";
import kyInstance from "@/lib/ky";
import { PostsPage } from "@/lib/types";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

interface SearchResultsProps {
  query: string;
}

export default function SearchResults({ query }: SearchResultsProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: ["post-feed", "search", query],
    queryFn: ({ pageParam }) =>
      kyInstance
        .get("/api/search", {
          searchParams: {
            q: query,
            ...(pageParam ? { cursor: pageParam } : {}),
            isMobile: String(isMobile),
          },
        })
        .json<PostsPage>(),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    gcTime: 0,
  });

  const posts = data?.pages.flatMap((page) => page.posts) || [];

  if (status === "pending") {
    return <PostsLoadingSkeleton />;
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

      {status === "success" && !posts.length && !hasNextPage && (
        <p className="text-center text-muted-foreground py-4">
          검색 결과가 없습니다.
        </p>
      )}

      {!hasNextPage && posts.length > 0 && (
        <p className="text-center text-muted-foreground py-4">
          모든 검색 결과를 불러왔습니다.
        </p>
      )}
    </InfiniteScrollContainer>
  );
}

// "use client";

// import InfiniteScrollContainer from "@/components/InfiniteScrollContainer";
// import PostGrid from "@/components/PostGrid";
// import Post from "@/components/posts/Post";
// import PostsLoadingSkeleton from "@/components/posts/PostsLoadingSkeleton";
// import kyInstance from "@/lib/ky";
// import { PostsPage } from "@/lib/types";
// import { useInfiniteQuery } from "@tanstack/react-query";
// import { Loader2 } from "lucide-react";

// interface SearchResultsProps {
//   query: string;
// }

// export default function SearchResults({ query }: SearchResultsProps) {
//   const {
//     data,
//     fetchNextPage,
//     hasNextPage,
//     isFetching,
//     isFetchingNextPage,
//     status,
//   } = useInfiniteQuery({
//     queryKey: ["post-feed", "search", query],
//     queryFn: ({ pageParam }) =>
//       kyInstance
//         .get("/api/search", {
//           searchParams: {
//             q: query,
//             ...(pageParam ? { cursor: pageParam } : {}),
//           },
//         })
//         .json<PostsPage>(),
//     initialPageParam: null as string | null,
//     getNextPageParam: (lastPage) => lastPage.nextCursor,
//     gcTime: 0,
//   });

//   const posts = data?.pages.flatMap((page) => page.posts) || [];

//   if (status === "pending") {
//     return <PostsLoadingSkeleton />;
//   }

//   if (status === "success" && !posts.length && !hasNextPage) {
//     return (
//       <p className="text-center text-muted-foreground">
//         조회하신 검색결과가 없습니다.
//       </p>
//     );
//   }

//   if (status === "error") {
//     return (
//       <p className="text-center text-destructive">
//         조회에 에러가 발생했습니다.
//       </p>
//     );
//   }

//   return (
//     <InfiniteScrollContainer
//       className="space-y-5"
//       onBottomReached={() => hasNextPage && !isFetching && fetchNextPage()}
//     >
//       {posts.map((post) => (
//         <Post key={post.id} post={post} />
//       ))}
//       {isFetchingNextPage && <Loader2 className="mx-auto my-3 animate-spin" />}
//     </InfiniteScrollContainer>
//   );
// }
