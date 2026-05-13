"use client";

import Image from "next/image";
import { useSession } from "@/components/SessionProvider";
import PostGrid from "@/components/PostGrid";
import PostsLoadingSkeleton from "@/components/posts/PostsLoadingSkeleton";
import { useInfiniteQuery } from "@tanstack/react-query";
import kyInstance from "@/lib/ky";
import { PostsPage } from "@/lib/types";

export default function Bookmarks() {
  const { user } = useSession();

  const {
    data,
    status,
  } = useInfiniteQuery({
    queryKey: ["post-feed", "bookmarks"],
    queryFn: ({ pageParam }) =>
      kyInstance
        .get(
          "/api/posts/bookmarked",
          pageParam ? { searchParams: { cursor: pageParam } } : {},
        )
        .json<PostsPage>(),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: !!user,
  });

  const initialPosts = data?.pages[0]?.posts || [];

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
          로그인이 필요한 메뉴입니다
        </p>
      </div>
    );
  }

  if (status === "pending") {
    return <PostsLoadingSkeleton />;
  }

  if (status === "success" && !initialPosts.length) {
    return (
      <p className="text-center text-muted-foreground mt-8">
        목록 컨텐츠가 아직 없습니다.
      </p>
    );
  }

  if (status === "error") {
    return (
      <p className="text-center text-destructive mt-8">
        컨텐츠를 불러오는 중 오류가 발생했습니다.
      </p>
    );
  }

  return (
    <PostGrid 
      initialPosts={initialPosts}
      apiEndpoint="/api/posts/bookmarked"
    />
  );
}

// "use client";

// import Image from "next/image";
// import InfiniteScrollContainer from "@/components/InfiniteScrollContainer";
// import PostCard from "@/components/posts/PostCard";
// import PostsLoadingSkeleton from "@/components/posts/PostsLoadingSkeleton";
// import kyInstance from "@/lib/ky";
// import { PostsPage } from "@/lib/types";
// import { useInfiniteQuery } from "@tanstack/react-query";
// import { Loader2 } from "lucide-react";
// import { useSession } from "../../SessionProvider";

// export default function Bookmarks() {
//   const { user } = useSession();

//   // 로그인하지 않은 경우 안내 메시지 표시
//   if (!user) {
//     return (
//       <div className="flex flex-col items-center justify-center space-y-4 py-20">
//         <div className="relative w-24 h-24 mb-4">
//           <Image
//             src="/MS Logo emblem.svg"
//             alt="MS Logo"
//             fill
//             className="object-contain opacity-50"  // 로고를 약간 투명하게
//           />
//         </div>
//         <p className="text-lg text-muted-foreground text-center font-medium">
//           로그인이 필요한 메뉴입니다
//         </p>
//       </div>
//     );
//   }

//   // 로그인한 경우에만 데이터 쿼리 실행
//   const {
//     data,
//     fetchNextPage,
//     hasNextPage,
//     isFetching,
//     isFetchingNextPage,
//     status,
//   } = useInfiniteQuery({
//     queryKey: ["post-feed", "bookmarks"],
//     queryFn: ({ pageParam }) =>
//       kyInstance
//         .get(
//           "/api/posts/bookmarked",
//           pageParam ? { searchParams: { cursor: pageParam } } : {},
//         )
//         .json<PostsPage>(),
//     initialPageParam: null as string | null,
//     getNextPageParam: (lastPage) => lastPage.nextCursor,
//   });

//   const posts = data?.pages.flatMap((page) => page.posts) || [];

//   if (status === "pending") {
//     return <PostsLoadingSkeleton />;
//   }

//   if (status === "success" && !posts.length && !hasNextPage) {
//     return (
//       <p className="text-center text-muted-foreground">
//         북마크한 컨텐츠가 없습니다.
//       </p>
//     );
//   }

//   if (status === "error") {
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
//         ))}
//       </div>
      
//       {isFetchingNextPage && (
//         <div className="flex justify-center p-4">
//           <Loader2 className="animate-spin" />
//         </div>
//       )}    

//       {!hasNextPage && posts.length > 0 && (
//         <p className="text-center text-muted-foreground py-4">
//           모든 컨텐츠를 로딩했습니다.
//         </p>
//       )}
//     </InfiniteScrollContainer>
//   );
// }