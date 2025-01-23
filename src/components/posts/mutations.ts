// 삭제 뮤테이션 파일

import { Post } from "@prisma/client";
import { PostsPage } from "@/lib/types";
import {
  InfiniteData,
  QueryFilters,
  useMutation,
  useQueryClient
} from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { useToast } from "../ui/use-toast";
import { deletePost } from "./actions";
import { createPostSchema } from "@/lib/validation";
import { z } from "zod";
import { PostWithVideos } from "@/lib/types";

export type CreatePostInput = z.infer<typeof createPostSchema>;

export function useDeletePostMutation() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();

  return useMutation({
    mutationFn: deletePost,
    onSuccess: async (deletedPost) => {
      try {
        // 1. 클라이언트 상태 업데이트 (즉시 UI 반영)
        queryClient.setQueriesData<InfiniteData<PostsPage>>(
          {
            queryKey: ["your-posts", "PUBLISHED"],
            exact: true
          },
          (oldData) => {
            if (!oldData) return oldData;
            return {
              pageParams: oldData.pageParams,
              pages: oldData.pages.map(page => ({
                ...page,
                posts: page.posts.filter(post => post.id !== deletedPost.id)
              }))
            };
          }
        );

        queryClient.setQueriesData<InfiniteData<PostsPage>>(
          {
            queryKey: ["your-posts", "DRAFT"],
            exact: true
          },
          (oldData) => {
            if (!oldData) return oldData;
            return {
              pageParams: oldData.pageParams,
              pages: oldData.pages.map(page => ({
                ...page,
                posts: page.posts.filter(post => post.id !== deletedPost.id)
              }))
            };
          }
        );

        // 2. 페이지 revalidate (백그라운드에서 처리)
        const revalidatePaths = [
          '/',
          '/categories/recent',
          ...deletedPost.categories.map(category => 
            `/categories/${category.toLowerCase()}`
          )
        ];

        Promise.all(
          revalidatePaths.map(path =>
            fetch('/api/revalidate', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ path })
            })
          )
        ).catch(error => {
          console.error('Failed to revalidate paths:', error);
        });

        // 3. 알림
        toast({
          description: "Post deleted",
        });

        // 4. 페이지 이동 (현재 페이지가 삭제된 포스트 페이지인 경우)
        if (pathname === `/posts/${deletedPost.id}`) {
          router.push('/');
        }

        // 5. 서버 컴포넌트 리프레시 (마지막에 처리)
        setTimeout(() => {
          router.refresh();
        }, 0);

      } catch (error) {
        console.error('Error in onSuccess:', error);
      }
    },
    onError(error) {
      console.error('Delete mutation error:', error);
      toast({
        variant: "destructive",
        description: "Failed to delete post. Please try again.",
      });
    },
  });
}
// useCreatePost 함수
// export function useCreatePost() {
//   const { toast } = useToast();
//   const queryClient = useQueryClient();
//   const router = useRouter();

//   const mutation = useMutation({
//     mutationFn: async (data: PostWithVideos & { status: 'PUBLISHED' | 'DRAFT' }) => {
//       const response = await fetch('/api/posts', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(data),
//       });

//       if (!response.ok) {
//         throw new Error('Failed to create post');
//       }

//       const post = await response.json();
//       return post;
//     },
//     onSuccess: async (createdPost, variables) => {
//       // 기존 캐시 업데이트 패턴 유지
//       const queryFilter: QueryFilters = { queryKey: ["post-feed"] };
//       await queryClient.cancelQueries(queryFilter);

//       queryClient.setQueriesData<InfiniteData<PostsPage>>(
//         queryFilter,
//         (oldData) => {
//           if (!oldData) return;

//           return {
//             pageParams: oldData.pageParams,
//             pages: oldData.pages.map((page, index) => {
//               // 첫 페이지에만 새 포스트 추가
//               if (index === 0) {
//                 return {
//                   ...page,
//                   posts: [createdPost, ...page.posts],
//                 };
//               }
//               return page;
//             }),
//           };
//         }
//       );

//       // 상태에 따른 메시지
//       toast({
//         description: variables.status === 'PUBLISHED' 
//           ? "포스트가 게시되었습니다" 
//           : "임시저장되었습니다",
//       });

//       // 포스트 생성 후 해당 포스트 페이지로 이동
//       router.push(`/posts/${createdPost.id}`);
//     },
//     onError: (error) => {
//       console.error(error);
//       toast({
//         variant: "destructive",
//         description: "Failed to create post. Please try again.",
//       });
//     },
//   });

//   return mutation;
// }

