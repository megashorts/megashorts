// src/components/posts/editor/mutations.ts : React Query로 액션티에스의 submitPost() 호출, 성공 시 UI 상태 업데이트 및 페이지 이동 등 후처리

import { PostsPage } from "@/lib/types";
import {
  InfiniteData,
  QueryFilters,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { submitPost } from "./actions";
import { useRouter } from "next/navigation";

export function useSubmitPostMutation() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: submitPost,
    onSuccess: async (newPost) => {
      try {
        // 서버 액션에서 on-demand 무효화를 처리하므로 클라이언트는 refresh만 수행
        router.refresh();

        // 클라이언트 상태 업데이트
        // const queryFilter = {
        //   queryKey: ["post-feed"],
        //   predicate(query) {
        //     return (
        //       query.queryKey.includes("for-you") ||
        //       (query.queryKey.includes("user-posts") &&
        //        user?.id ? query.queryKey.includes(user.id) : false)
        //     );
        //   },
        // } satisfies QueryFilters;

        const queryFilter: QueryFilters = {
        queryKey: ['posts'],
        predicate: () => true,
      };


        await queryClient.cancelQueries(queryFilter);

        queryClient.setQueriesData<InfiniteData<PostsPage, string | null>>(
          queryFilter,
          (oldData) => {
            if (!oldData) return oldData;
            const firstPage = oldData.pages[0];
            if (!firstPage) return oldData;

            // if ('id' in newPost && newPost.id) {
            //   return {
            //     pageParams: oldData.pageParams,
            //     pages: oldData.pages.map(page => ({
            //       ...page,
            //       posts: page.posts.map(post => 
            //         post.id === newPost.id ? newPost : post
            //       )
            //     }))
            //   };
            // }

            if ('id' in newPost && newPost.id) {
              return {
                pageParams: oldData.pageParams,
                pages: oldData.pages.map((page) => ({
                  ...page,
                  posts: page.posts.map((post) =>
                    post.id === newPost.id ? newPost : post
                  ),
                })),
              };
            }

            
            return {
              pageParams: oldData.pageParams,
              pages: [
                {
                  posts: [newPost, ...firstPage.posts],
                  nextCursor: firstPage.nextCursor,
                },
                ...oldData.pages.slice(1),
              ],
            };
          }
        );

        // 상세페이지 이동
        if (newPost.id) {
          router.push(`/posts/${newPost.id}?t=${Date.now()}`);
        }

      } catch (error) {
        console.error('Post submit follow-up failed:', error);
      }
    },
    onError(error) {
      console.error(error);
    },
  });

  return mutation;
}
