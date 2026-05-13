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
