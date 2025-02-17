// "use client";

// import Image from "next/image";
// import { useSession } from "@/components/SessionProvider";
// import PostGrid from "@/components/PostGrid";
// import PostsLoadingSkeleton from "@/components/posts/PostsLoadingSkeleton";
// import { useInfiniteQuery } from "@tanstack/react-query";
// import kyInstance from "@/lib/ky";
// import { PostsPage } from "@/lib/types";

// export default function WatchingContent() {
//   const { user } = useSession();

//   const {
//     data,
//     status,
//   } = useInfiniteQuery({
//     queryKey: ["post-feed", "watching"],
//     queryFn: ({ pageParam }) =>
//       kyInstance
//         .get(
//           "/api/videos/watching",
//           pageParam ? { searchParams: { cursor: pageParam } } : {},
//         )
//         .json<PostsPage>(),
//     initialPageParam: null as string | null,
//     getNextPageParam: (lastPage) => lastPage.nextCursor,
//     enabled: !!user,
//   });

//   const initialPosts = data?.pages[0]?.posts || [];

//   if (!user) {
//     return (
//       <div className="flex flex-col items-center justify-center space-y-4 py-20">
//         <div className="relative w-24 h-24 mb-4">
//           <Image
//             src="/MS Logo emblem.svg"
//             alt="MS Logo"
//             fill
//             className="object-contain opacity-50"
//           />
//         </div>
//         <p className="text-lg text-muted-foreground text-center font-medium">
//           로그인이 필요한 메뉴입니다
//         </p>
//       </div>
//     );
//   }

//   if (status === "pending") {
//     return <PostsLoadingSkeleton />;
//   }

//   if (status === "success" && !initialPosts.length) {
//     return (
//       <p className="text-center text-muted-foreground mt-8">
//         시청 중인 컨텐츠가 없습니다.
//       </p>
//     );
//   }

//   if (status === "error") {
//     return (
//       <p className="text-center text-destructive mt-8">
//         컨텐츠를 불러오는 중 오류가 발생했습니다.
//       </p>
//     );
//   }

//   return (
//     <PostGrid 
//       initialPosts={initialPosts}
//       apiEndpoint="/api/videos/watching"
//     />
//   );
// }