"use client";

import { LikeInfo, PostData } from "@/lib/types";
import LikeButton from "./LikeButtonOnly";
import BookmarkButton from "./BookmarkButton";
import PostMoreButton from "./PostMoreButton";
import { Play, Share2 } from "lucide-react";
import { useToast } from "../ui/use-toast";
import {
  QueryKey,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";  // LikeButtonOnly와 동일한 import
import kyInstance from "@/lib/ky";

interface ClientPostActionsProps {
  post: PostData;
  userId: string;
  hasEditPermission: boolean;
}

export default function ClientPostActions({ post, userId, hasEditPermission }: ClientPostActionsProps) {
    const queryKey: QueryKey = ["like-info", post.id];
    const { toast } = useToast();  // useToast hook 사용

    const { data } = useQuery({
        queryKey,
        queryFn: () =>
          kyInstance.get(`/api/posts/${post.id}/likes`).json<LikeInfo>(),
        initialData: {
          likes: post._count.likes,
          isLikedByUser: post.likes.some((like) => like.userId === userId),
        },
        staleTime: Infinity,
      });
  
    const handleShare = async () => {
      try {
        await navigator.clipboard.writeText(`${window.location.origin}/posts/${post.id}`);
        toast({
          description: 'URL이 복사되었습니다.'
        });
      } catch (err) {
        toast({
          variant: "destructive",
          description: 'URL 복사에 실패했습니다.'
        });
      }
    };
  

  return (
    <div className="flex items-start justify-between mb-4">
      {/* 액션 버튼 그룹 */}
      <div className="flex items-center gap-3">
        {post.videos && post.videos.length > 0 && (
          <div className="w-12 aspect-square flex items-center justify-center hover:bg-white/15 border border-white hover:border-red-700 rounded-full">
            <Play className="size-5 text-white" />
          </div>
        )}
          <div className="w-12 aspect-square flex items-center justify-center hover:bg-white/15 border border-white hover:border-red-700 rounded-full">
          <BookmarkButton
            postId={post.id}
            initialState={{
              isBookmarkedByUser: post.bookmarks.some(
                (bookmark) => bookmark.userId === userId
              ),
            }}
          />
        </div>
        <div className="w-12 aspect-square flex items-center justify-center hover:bg-white/15 border border-white hover:border-red-700 rounded-full">
          <Share2 
            className="size-5 text-white cursor-pointer" 
            onClick={handleShare}
            />
        </div>
        <div className="flex items-center">
        <div className="w-12 aspect-square flex items-center justify-center hover:bg-white/15 border border-white hover:border-red-700 rounded-full">
          <LikeButton
              postId={post.id}
              initialState={{
                likes: post._count.likes,
                isLikedByUser: post.likes.some((like) => like.userId === userId),
              }}
            />
          </div>
          <span className="ml-3 text-sm font-medium tabular-nums text-white">
            {data.likes} <span className="hidden sm:inline">likes</span>
          </span>
        </div>
      </div>
      {/* PostMoreButton */}
      {hasEditPermission && <PostMoreButton post={post} />}
    </div>
  );
}