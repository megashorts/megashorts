import { useQuery } from "@tanstack/react-query";
import type { Post, PostStatus, CategoryType } from '@prisma/client';

interface UsePostsOptions {
  page?: number;
  limit?: number;
  status?: PostStatus;
  category?: CategoryType;
}

export function usePosts({
  page = 1,
  limit = 10,
  status,
  category
}: UsePostsOptions = {}) {
  return useQuery({
    queryKey: ["posts", { page, limit, status, category }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });

      if (status) params.append("status", status);
      if (category) params.append("category", category);

      const response = await fetch(
        `/api/posts?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch posts");
      }

      return response.json();
    },
    staleTime: 60 * 1000, // 1분
    gcTime: 5 * 60 * 1000, // 5분
    placeholderData: (previousData) => previousData  // keepPreviousData 대신 사용
  });
}

export function usePost(id: string) {
  return useQuery({
    queryKey: ["posts", id],
    queryFn: async () => {
      const response = await fetch(`/api/posts/${id}`);

      if (!response.ok) {
        throw new Error("Failed to fetch post");
      }

      return response.json() as Promise<Post>;
    },
    staleTime: 60 * 1000 // 1분
  });
}