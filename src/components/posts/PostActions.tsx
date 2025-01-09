'use client';

import { PostData } from "@/lib/types";
import { MessageSquare } from "lucide-react";
import LikeButton from "./LikeButton";
import BookmarkButton from "./BookmarkButton";
import { useState } from "react";
import Comments from "../comments/Comments";

interface PostActionsProps {
  post: PostData;
  userId: string;
}

export default function PostActions({ post, userId }: PostActionsProps) {
  const [showComments, setShowComments] = useState(false);

  return (
    <>
      <hr className="text-muted-foreground" />
      <div className="flex justify-between gap-5">
        <div className="flex items-center gap-5">
          <LikeButton
            postId={post.id}
            initialState={{
              likes: post._count.likes,
              isLikedByUser: post.likes.some((like) => like.userId === userId),
            }}
          />
          <button onClick={() => setShowComments(!showComments)} className="flex items-center gap-2">
            <MessageSquare className="size-5" />
            <span className="text-sm font-medium tabular-nums">
              {post._count.comments}{" "}
              <span className="hidden sm:inline">comments</span>
            </span>
          </button>
        </div>
        <BookmarkButton
          postId={post.id}
          initialState={{
            isBookmarkedByUser: post.bookmarks.some(
              (bookmark) => bookmark.userId === userId,
            ),
          }}
        />
      </div>
      {showComments && <Comments post={post} />}
    </>
  );
}
