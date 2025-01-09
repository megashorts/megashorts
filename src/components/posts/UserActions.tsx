"use client";

import LikeButton from "./LikeButtonOnly";
import BookmarkButton from "./BookmarkButton";
import { useQuery } from "@tanstack/react-query";
import { LikeInfo, PostData } from "@/lib/types";
import kyInstance from "@/lib/ky";
import { useSession } from "@/components/SessionProvider";

interface UserActionsProps {
  post: PostData;
}

export default function UserActions({ post }: UserActionsProps) {
  const { user } = useSession();
  const { data } = useQuery({
    queryKey: ["like-info", post.id],
    queryFn: () =>
      kyInstance.get(`/api/posts/${post.id}/likes`).json<LikeInfo>(),
    initialData: {
      likes: post._count.likes,
      isLikedByUser: user ? post.likes.some((like) => like.userId === user.id) : false,
    },
    staleTime: Infinity,
    enabled: !!user,  // user가 있을 때만 쿼리 실행
  });

  if (!user) return null;

  return (
    <div className="flex items-center gap-3">
      <div className="w-12 aspect-square flex items-center justify-center hover:bg-white/10 border border-white rounded-full">
        <BookmarkButton
          postId={post.id}
          initialState={{
            isBookmarkedByUser: post.bookmarks.some(
              (bookmark) => bookmark.userId === user.id
            ),
          }}
        />
      </div>
      <div className="flex items-center">
        <div className="w-12 aspect-square flex items-center justify-center hover:bg-white/10 border border-white rounded-full">
          <LikeButton
            postId={post.id}
            initialState={{
              likes: post._count.likes,
              isLikedByUser: post.likes.some((like) => like.userId === user.id),
            }}
          />
        </div>
        <span className="ml-3 text-sm font-medium tabular-nums text-white">
          {data.likes} <span className="hidden sm:inline">likes</span>
        </span>
      </div>
    </div>
  );
}