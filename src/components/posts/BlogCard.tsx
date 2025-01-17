"use client";

import { Post, User, Prisma } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { Pin } from "lucide-react";

type BlogPost = Prisma.PostGetPayload<{
  include: {
    user: true;
  }
}>;

interface BlogCardProps {
  post: BlogPost;
}

export default function BlogCard({ post }: BlogCardProps) {
  return (
    <Link href={`/blog/${post.id}`} className="block">
      <div className="flex gap-3 py-2 sm:p-2 rounded-md hover:bg-accent/50 transition-colors">
        {/* 썸네일 (2:3 비율) */}
        <div className="relative w-[100px] sm:w-[150px] aspect-[3/2] flex-shrink-0">
          <Image
            src={post.thumbnailUrl || "/post-placeholder.jpg"}
            alt={post.title || ""}
            fill
            className="object-cover rounded-sm"
            sizes="200px"
          />
        </div>
        
        {/* 컨텐츠 */}
        <div className="flex flex-col flex-1 min-w-0">
          {/* 제목 */}
          <h3 className="text-base sm:text-lg font-semibold line-clamp-1 mb-1">
            {post.title}
          </h3>
          
          <div className="text-xs sm:text-sm text-gray-400 line-clamp-2 mt-1">
            <span>{post.content}</span>
          </div>

          {/* 하단 정보 */}
          {/* <div className="flex justify-between items-center text-sm text-muted-foreground mt-2"> */}
          <div className="items-end text-start sm:text-end text-[10px] sm:text-xs text-muted-foreground mt-2">
            {post.featured && (
              <Pin className="inline-block w-4 h-4 mr-1 text-red-500" />
            )}
            <span>{format(post.createdAt, 'yyyy.MM.dd')}{"  "}</span>
            <span>{post.user.displayName}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}