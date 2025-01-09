"use client";


import { Play, Share2 } from "lucide-react";
import { useToast } from "../ui/use-toast";
import { PostData } from "@/lib/types";
import Link from "next/link";

interface PublicActionsProps {
  post: PostData;  // userId 제거
}

export default function PublicActions({ post }: PublicActionsProps) {
  const { toast } = useToast();

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
    <div className="flex items-center gap-3">
      {post.videos && post.videos.length > 0 && (


        <Link 
          href={`/video-view/${post.id}`}
          className="w-12 aspect-square flex items-center justify-center hover:bg-white/10 border border-white rounded-full"
        >
          <Play className="size-5 text-white" />
        </Link>

      )}
      <div className="w-12 aspect-square flex items-center justify-center hover:bg-white/10 border border-white rounded-full">
        <Share2 
          className="size-5 text-white cursor-pointer" 
          onClick={handleShare}
        />
      </div>
    </div>
  );
}