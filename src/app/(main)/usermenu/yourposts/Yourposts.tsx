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

interface YourPostsProps {
  status: "PUBLISHED" | "DRAFT";
}

export default function YourPosts({ status }: YourPostsProps) {
  const isMobile = useIsMobile();

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
          ? "게시된 컨텐츠가 없습니다."
          : "임시저장된 컨텐츠가 없습니다."}
      </p>
    );
  }

  if (queryStatus === "error") {
    return (
      <p className="text-center text-destructive">
        컨텐츠를 불러오는 중 오류가 발생했습니다.
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
          모든 컨텐츠를 로딩했습니다.
        </p>
      )}
    </InfiniteScrollContainer>
  );
}

// "use client";

// import InfiniteScrollContainer from "@/components/InfiniteScrollContainer";
// import PostGrid from "@/components/PostGrid";
// import PostCard from "@/components/posts/PostCard";
// import PostsLoadingSkeleton from "@/components/posts/PostsLoadingSkeleton";
// import kyInstance from "@/lib/ky";
// import { PostsPage } from "@/lib/types";
// import { useInfiniteQuery } from "@tanstack/react-query";
// import { Loader2 } from "lucide-react";

// // status prop 타입 정의 복원
// interface YourPostsProps {
//   status: "PUBLISHED" | "DRAFT";
// }

// export default function YourPosts({ status }: YourPostsProps) {
//   const isMobile = window.innerWidth < 768;  // 모바일 체크

//   const {
//     data,
//     fetchNextPage,
//     hasNextPage,
//     isFetching,
//     isFetchingNextPage,
//     status: queryStatus,
//   } = useInfiniteQuery({
//     // post-feed 제거하고 your-posts와 status만 사용
//     queryKey: ["your-posts", status],
//     queryFn: ({ pageParam }) =>
//       kyInstance
//         .get(
//           "/api/posts/for-you",
//           { 
//             searchParams: new URLSearchParams({
//               ...(pageParam ? { cursor: pageParam } : {}),
//               status,
//               isMobile: String(isMobile),
//             })
//           }
//         )
//         .json<PostsPage>(),
//     initialPageParam: null as string | null,
//     getNextPageParam: (lastPage) => lastPage.nextCursor,
//   });

//   const posts = data?.pages.flatMap((page) => page.posts) || [];

//   if (queryStatus === "pending") {
//     return <PostsLoadingSkeleton />;
//   }

//   if (queryStatus === "success" && !posts.length && !hasNextPage) {
//     return (
//       <p className="text-center text-muted-foreground">
//         {status === "PUBLISHED" 
//           ? "게시된 컨텐츠가 없습니다."
//           : "임시저장된 컨텐츠가 없습니다."}
//       </p>
//     );
//   }

//   if (queryStatus === "error") {
//     return (
//       <p className="text-center text-destructive">
//         컨텐츠를 불러오는 중 오류가 발생했습니다.
//       </p>
//     );
//   }

//   return (
//     <InfiniteScrollContainer
//       className="space-y-5"
//       onBottomReached={() => hasNextPage && !isFetching && fetchNextPage()}
//     >
//       <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
//         {posts.map((post) => (
//           <PostCard key={post.id} post={post} />

//           // <PostGrid 
//           //   initialPosts={[]}
//           //   apiEndpoint="/api/posts/for-you"
//           // />
//         ))}
//       </div>
      
//       {/* 로딩 상태 표시 */}
//       {isFetchingNextPage && (
//         <div className="flex justify-center p-4">
//           <Loader2 className="animate-spin" />
//         </div>
//       )}
      
//       {/* 모든 포스트 로드 완료 메시지 */}
//       {!hasNextPage && posts.length > 0 && (
//         <p className="text-center text-muted-foreground py-4">
//           모든 컨텐츠를 로딩했습니다.
//         </p>
//       )}
//     </InfiniteScrollContainer>
//   );
// }
