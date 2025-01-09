'use client';

import { PostData } from "@/lib/types";
import Image from "next/image";
import { useState, useEffect, useMemo } from "react";
import PostModal from "@/components/posts/PostModal";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useInView } from "react-intersection-observer";

interface PostGridProps {
  initialPosts: PostData[];
  category?: string;
  apiEndpoint?: string; // 선택적 API 엔드포인트
}

export default function PostGrid({ 
  initialPosts, 
  category,
  apiEndpoint = '/api/posts/by-category' // 기본값으로 기존 엔드포인트 사용
}: PostGridProps) {
  const [selectedPost, setSelectedPost] = useState<PostData | null>(null);
  const { ref, inView } = useInView();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["posts", apiEndpoint, category],
    queryFn: async ({ pageParam }) => {
      const searchParams = new URLSearchParams({
        ...(pageParam ? { cursor: pageParam } : {}),
        ...(category ? { category } : {})
      });
      
      const res = await fetch(`${apiEndpoint}?${searchParams}`);
      return res.json();
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialData: {
      pages: [{
        posts: initialPosts,
        nextCursor: initialPosts.length === 20 ? initialPosts[19].id : null
      }],
      pageParams: [null]
    },
    staleTime: 0,
  });

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage]);

  // 중복 제거된 포스트 목록 생성
  const allPosts = useMemo(() => {
    const posts = data?.pages.flatMap(page => page.posts) || initialPosts;
    // Set을 사용하여 중복 제거
    const uniquePosts = Array.from(
      new Map(posts.map(post => [post.id, post])).values()
    );
    return uniquePosts;
  }, [data?.pages, initialPosts]);

  return (
    <>
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {allPosts.map((post) => (
          <div 
            key={post.id}
            className="relative aspect-[2/3] rounded-md overflow-hidden cursor-pointer group"
            onClick={() => setSelectedPost(post)}
          >
            <Image
              src={post.thumbnailUrl || '/post-placeholder.jpg'}
              alt={post.title || ''}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h3 className="text-sm text-white font-medium line-clamp-2">
                  {post.title}
                </h3>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div 
        ref={ref}
        className="flex justify-center p-4 mt-4"
      >
        {isFetchingNextPage ? (
          <Loader2 className="w-6 h-6 animate-spin" />
        ) : hasNextPage ? (
          <span className="text-muted-foreground">스크롤하여 더 보기...</span>
        ) : allPosts.length > 0 ? (
          <span className="text-muted-foreground">모든 컨텐츠를 불러왔습니다</span>
        ) : null}
      </div>

      {selectedPost && (
        <PostModal 
          post={selectedPost} 
          handleClose={() => setSelectedPost(null)} 
        />
      )}
    </>
  );
}


// 'use client';

// import { PostData } from "@/lib/types";
// import Image from "next/image";
// import { useState, useEffect } from "react";
// import PostModal from "@/components/posts/PostModal";
// import { useInfiniteQuery } from "@tanstack/react-query";
// import { Loader2 } from "lucide-react";
// import { useInView } from "react-intersection-observer";

// interface PostGridProps {
//   initialPosts: PostData[];
//   category?: string;  // optional로 변경
// }

// export default function PostGrid({ initialPosts, category }: PostGridProps) {
//   const [selectedPost, setSelectedPost] = useState<PostData | null>(null);
//   const { ref, inView } = useInView();

//   const {
//     data,
//     fetchNextPage,
//     hasNextPage,
//     isFetchingNextPage,
//   } = useInfiniteQuery({
//     queryKey: ["posts", "by-category", category],
//     queryFn: async ({ pageParam }) => {
//       const searchParams = new URLSearchParams({
//         ...(pageParam ? { cursor: pageParam } : {}),
//         ...(category ? { category } : {})
//       });
      
//       const res = await fetch(`/api/posts/by-category?${searchParams}`);
//       return res.json();
//     },
//     initialPageParam: null as string | null,
//     getNextPageParam: (lastPage) => lastPage.nextCursor,
//     initialData: {
//       pages: [{
//         posts: initialPosts,
//         nextCursor: initialPosts.length === 20 ? initialPosts[19].id : null
//       }],
//       pageParams: [null]
//     },
//     staleTime: Infinity,
//   });

//   useEffect(() => {
//     if (inView && hasNextPage) {
//       fetchNextPage();
//     }
//   }, [inView, hasNextPage, fetchNextPage]);

//   const allPosts = data?.pages.flatMap(page => page.posts) || initialPosts;

//   return (
//     <>
//       <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
//         {allPosts.map((post) => (
//           <div 
//             key={post.id}
//             className="relative aspect-[2/3] rounded-md overflow-hidden cursor-pointer group"
//             onClick={() => setSelectedPost(post)}
//           >
//             <Image
//               src={post.thumbnailUrl || '/post-placeholder.jpg'}
//               alt={post.title || ''}
//               fill
//               className="object-cover transition-transform duration-300 group-hover:scale-105"
//               sizes="(max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
//               loading="lazy"
//             />
//             <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
//               <div className="absolute bottom-0 left-0 right-0 p-4">
//                 <h3 className="text-sm text-white font-medium line-clamp-2">
//                   {post.title}
//                 </h3>
//               </div>
//             </div>
//           </div>
//         ))}
//       </div>

//       <div 
//         ref={ref}
//         className="flex justify-center p-4 mt-4"
//       >
//         {isFetchingNextPage ? (
//           <Loader2 className="w-6 h-6 animate-spin" />
//         ) : hasNextPage ? (
//           <span className="text-muted-foreground">스크롤하여 더 보기...</span>
//         ) : allPosts.length > 0 ? (
//           <span className="text-muted-foreground">모든 컨텐츠를 불러왔습니다</span>
//         ) : null}
//       </div>

//       {selectedPost && (
//         <PostModal 
//           post={selectedPost} 
//           handleClose={() => setSelectedPost(null)} 
//         />
//       )}
//     </>
//   );
// }