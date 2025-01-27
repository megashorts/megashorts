import { useSession } from "@/components/SessionProvider";
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
  const { user } = useSession();
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: submitPost,
    onSuccess: async (newPost) => {
      try {
        // 1. 먼저 페이지들 재생성
        const revalidatePaths = [
          '/',  // 메인 페이지
          '/categories/recent'
        ];

        newPost.categories.forEach(category => {
          revalidatePaths.push(`/categories/${category.toLowerCase()}`);
        });

        if (newPost.id) {
          revalidatePaths.push(`/posts/${newPost.id}`);
        }

        await Promise.all(
          revalidatePaths.map(path =>
            fetch('/api/revalidate', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ path })
            })
          )
        );

        // 2. 서버 컴포넌트 리프레시
        router.refresh();

        // 3. 클라이언트 상태 업데이트
        const queryFilter = {
          queryKey: ["post-feed"],
          predicate(query) {
            return (
              query.queryKey.includes("for-you") ||
              (query.queryKey.includes("user-posts") &&
               user?.id ? query.queryKey.includes(user.id) : false)
            );
          },
        } satisfies QueryFilters;

        await queryClient.cancelQueries(queryFilter);

        queryClient.setQueriesData<InfiniteData<PostsPage, string | null>>(
          queryFilter,
          (oldData) => {
            if (!oldData) return oldData;
            const firstPage = oldData.pages[0];
            if (!firstPage) return oldData;

            if ('id' in newPost && newPost.id) {
              return {
                pageParams: oldData.pageParams,
                pages: oldData.pages.map(page => ({
                  ...page,
                  posts: page.posts.map(post => 
                    post.id === newPost.id ? newPost : post
                  )
                }))
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

        // 4. 메인페이지 새로고침 후 상세페이지로 이동
        if (newPost.id) {
          // 메인페이지를 백그라운드에서 열고 새로고침
          const mainWindow = window.open('/', '_blank');
          if (mainWindow) {
            mainWindow.addEventListener('load', () => {
              mainWindow.location.reload();
              mainWindow.close();
              // 메인페이지 새로고침 후 상세페이지로 이동
              router.push(`/posts/${newPost.id}?t=${Date.now()}`);
            });
          } else {
            // 팝업이 차단된 경우 바로 상세페이지로 이동
            router.push(`/posts/${newPost.id}?t=${Date.now()}`);
          }
        }

        // 4. 페이지 이동
        // if (newPost.id) {
        //   router.push(`/posts/${newPost.id}?t=${Date.now()}`);
        // }

      } catch (error) {
        console.error('Failed to revalidate paths:', error);
      }
    },
    onError(error) {
      console.error(error);
    },
  });

  return mutation;
}
