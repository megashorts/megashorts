"use client";

import { useSession } from "@/components/SessionProvider";
import { PostData } from "@/lib/types";
import { X, Play, ChevronDown } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
// import LikeButton from "./LikeButton";
import BookmarkButton from "./BookmarkButton";
import { cn } from "@/lib/utils";
import LikeButton from "./LikeButtonOnly";
import { getCategoryName } from "@/lib/constants";
import { useEffect, useRef, useState } from "react";
import VideoPlayer from "../videos/VideoPlayer";

interface PostModalProps {
  post: PostData;
  ageLimit?: number;
  handleClose: () => void;
}


export default function PostModal({ post, handleClose }: PostModalProps) {
  const { user } = useSession();
  const [showPreview, setShowPreview] = useState(true);
  const [isVideoReady, setIsVideoReady] = useState(false);
  
  function getVideoId(url: string | undefined): string | null {
    if (!url) return null;
    
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      // videodelivery.net/{videoId}/watch 형식에서 videoId 추출
      const videoId = pathParts.find(part => part !== '' && part !== 'watch');
      return videoId || null;
    } catch (e) {
      console.error('Error parsing video URL:', e);
      return null;
    }
  }

  const firstVideoId = getVideoId(post.videos?.[0]?.url);
  const videoRef = useRef<HTMLVideoElement>(null);

  return (
    <div 
      className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <link rel="preconnect" href="https://videodelivery.net" />
      <link rel="preconnect" href="https://iframe.videodelivery.net" />
      
      <div 
        className="bg-black rounded-lg overflow-hidden w-[90%] md:w-[30%]"
        style={{
          maxWidth: 'min(500px, 90vh * 2/3)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative aspect-[2/3] w-full">
          <button 
            onClick={handleClose}
            className="absolute top-3 right-3 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white z-10"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div 
            className={`absolute inset-0 transition-opacity duration-500 ${
              isVideoReady ? 'opacity-0 pointer-events-none' : 'opacity-100'
            }`}
          >
            <Image
              src={post.thumbnailUrl || '/post-placeholder.jpg'}
              alt={post.content || ''}
              fill
              className="object-cover"
            />
          </div>

          {(showPreview && firstVideoId) && (
            <div 
              className={`absolute inset-0 flex items-center justify-center pt-8 transition-opacity duration-500 ${
                isVideoReady ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <iframe
                src={`https://iframe.videodelivery.net/${firstVideoId}/watch?autoplay=1&controls=0&fit=cover&preload=auto&startTime=0&monitoring=false&customerMonitoring=false`}
                className="w-full h-full"
                style={{
                  width: '100%',
                  height: '100%',
                }}
                allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                onLoad={() => setIsVideoReady(true)}
              />
            </div>
          )}
        </div>
  
        <div className="w-full bg-black pl-10 pr-10 pb-6 pt-4">
              <div className="flex items-center mb-4">
                <div className="flex items-center gap-3">
                {post.videos && post.videos.length > 0 && (
                  <Link 
                    // href={`/watch/${post.id}`}
                    href={`/video-view/${post.id}`}
                    className="w-12 aspect-square flex items-center justify-center hover:bg-white/10 border border-white rounded-full"
                  >
                    <Play className="size-5 text-white" />
                  </Link>
                )}
                  {/* 좋아요와 북마크 버튼은 로그인 시에만 표시 */}
                  {user && (
                    <>
                      <div className="w-12 aspect-square flex items-center justify-center hover:bg-white/10 border border-white rounded-full">
                        <BookmarkButton
                          postId={post.id}
                          initialState={{
                            isBookmarkedByUser: post.bookmarks.some(
                              (bookmark) => bookmark.userId === user.id,
                            ),
                          }}
                        />
                      </div>
                      <div className="w-12 aspect-square flex items-center justify-center hover:bg-white/10 border border-white rounded-full">
                        <LikeButton
                          postId={post.id}
                          initialState={{
                            likes: post._count.likes,
                            isLikedByUser: post.likes.some((like) => like.userId === user.id),
                          }}
                        />
                      </div>
                    </>
                  )}
                </div>
                <div className="ml-auto">
                  <Link 
                    href={`/posts/${post.id}`}
                    className="w-12 aspect-square flex items-center justify-center hover:bg-white/10 border border-white rounded-full"
                  >
                    <ChevronDown className="w-8 h-8 text-white" />
                  </Link>
                </div>
              </div>

              <div className="w-[98%] mx-auto border-t border-white/15 mb-5"></div>


          {/* 컨텐츠 타이틀 */}
          <div className="mb-1 text-white/90">
            <p className="line-clamp-3 text-lg">
              {post.title}
            </p>
          </div>

          {/* 컨텐츠 소개글 */}
          <div className="mb-4 text-slate-400">
            <p className="line-clamp-3 text-sm font-sans">
              {post.content}
            </p>
          </div>

          {/* 연령제한 및 컨텐츠 정보 */}
          {/* <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center justify-center w-14 h-9 rounded-md border border-white font-bold text-xs text-white bg-blue-700"> 
              {post.ageLimit} +
            </div>
            <span className="text-sm text-gray-300">
              총 {post.videos?.length || 0}개의 컨텐츠
            </span>
            

          {/* 연령제한 및 컨텐츠 정보 */}
          <div className="flex items-center gap-4 mb-4">
            <div className={`flex items-center justify-center w-14 h-9 rounded-md border border-white font-bold text-sm text-white ${
                post.ageLimit === 18 ? "bg-red-700" : "bg-blue-700"
              }`}>
              {post.ageLimit === 0 ? "전체" : `${post.ageLimit} +`}
            </div>
            <span className="text-sm text-gray-300">
              {/* {post.videos?.length || 0}개 동영상 */}
              {post.videoCount || 0}개 동영상
            </span>
          </div>
  
          {/* 카테고리 */}
          <div className="flex flex-wrap gap-2">
            {post.categories?.map((category) => (
              <span
                key={category}
                // className="flex items-center px-3 py-2 rounded-sm bg-red-700 border border-red-700 text-gray-100 text-[10px]"
                className="flex items-center py-2 rounded-sm text-muted-foreground text-xs"
              >
                #{getCategoryName(category)}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}