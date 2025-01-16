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
      const videoId = pathParts.find(part => part !== '' && part !== 'watch');
      return videoId || null;
    } catch (e) {
      console.error('Error parsing video URL:', e);
      return null;
    }
  }

  const firstVideoId = getVideoId(post.videos?.[0]?.url);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<any>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !firstVideoId || !showPreview) return;

    let isMounted = true;

    const initHls = async () => {
      try {
        const { default: Hls } = await import('hls.js');
        
        if (Hls.isSupported()) {
          const hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 90
          });
          hlsRef.current = hls;

          const videoUrl = `https://customer-2cdfxbmja64x0pqo.cloudflarestream.com/${firstVideoId}/manifest/video.m3u8`;
          hls.loadSource(videoUrl);
          hls.attachMedia(video);

          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            if (isMounted) {
              // video.muted = true;
              video.play().then(() => {
                setIsVideoReady(true);
              }).catch(error => {
                console.error('Error playing video:', error);
              });
            }
          });

          hls.on(Hls.Events.ERROR, (_event: any, data: any) => {
            if (data.fatal) {
              switch (data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                  hls.startLoad();
                  break;
                case Hls.ErrorTypes.MEDIA_ERROR:
                  hls.recoverMediaError();
                  break;
                default:
                  hls.destroy();
                  initHls();
                  break;
              }
            }
          });
        }
        else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = `https://customer-2cdfxbmja64x0pqo.cloudflarestream.com/${firstVideoId}/manifest/video.m3u8`;
          video.addEventListener('loadedmetadata', () => {
            if (isMounted) {
              video.muted = true;
              video.play().then(() => {
                setIsVideoReady(true);
              }).catch(console.error);
            }
          });
        }
      } catch (error) {
        console.error('Error initializing HLS:', error);
      }
    };

    initHls();

    return () => {
      isMounted = false;
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [firstVideoId, showPreview]);

  if (typeof window !== 'undefined' && (window.innerWidth < 1024 || window.innerHeight < 800)) {
    return (
      <div 
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4 border"
        onClick={handleClose}
      >

        <link rel="preconnect" href="https://videodelivery.net" />
        <link rel="preconnect" href="https://iframe.videodelivery.net" />
        
        <div 
          className="bg-black rounded-lg overflow-hidden w-[90%] max-w-[340px]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 상단 영역: 썸네일(좌측 50%) + 버튼(우측) */}
          <div className="flex">
            {/* 썸네일/비디오 영역 */}
            <div className="w-3/4 relative aspect-video">

              
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
{/* 
              {(showPreview && firstVideoId) && (
                <div 
                  className={`absolute inset-0 transition-opacity duration-500 ${
                    isVideoReady ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  <iframe
                    src={`https://iframe.videodelivery.net/${firstVideoId}/watch?autoplay=1&controls=0&fit=cover&preload=auto&startTime=0&monitoring=false&customerMonitoring=false`}
                    className="w-full h-full translate-x-2"
                    allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    onLoad={() => setIsVideoReady(true)}
                  />
                </div>
              )}
            </div> */}

              {(showPreview && firstVideoId) && (
                <div 
                  className={`absolute inset-0 transition-opacity duration-500 ${
                    isVideoReady ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  {/* <VideoPlayer
                    videoId={firstVideoId}
                    postId={post.id}
                    sequence={1}
                    isActive={true}
                    className="w-full h-full"
                    controls={false}
                  /> */}
                  <video
                    ref={videoRef}
                    playsInline
                    preload="auto"
                    className="w-full h-full translate-x-2"
                    autoPlay
                    onLoad={() => setIsVideoReady(true)}
                  />
                </div>
              )}
            </div>

            {/* 버튼 영역 */}
            <div className="flex flex-col items-center justify-end gap-4 p-4">
              <button 
                onClick={handleClose}
                className="relative top-0 left-5 -translate-y-2 p-1 bg-slate-500/15 hover:bg-black/70 rounded-full border-red-500 text-muted-foreground z-10"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="w-10 aspect-square flex items-center justify-center hover:bg-white/10"></div>
              <div className="w-10 aspect-square flex items-center justify-center hover:bg-white/10"></div>
              {!user && (
                <>
                  <div className="w-10 aspect-square flex items-center justify-center hover:bg-white/10"></div>
                  <div className="w-10 aspect-square flex items-center justify-center hover:bg-white/10"></div>
                </>
              )}
              {post.videos && post.videos.length > 0 && (
                <Link 
                  href={`/video-view/${post.id}`}
                  className="w-12 aspect-square flex items-center justify-center hover:bg-white/10 border border-white rounded-full"
                >
                  <Play className="size-5 text-white" />
                </Link>
              )}
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
              <Link 
                href={`/posts/${post.id}`}
                className="w-12 aspect-square flex items-center justify-center hover:bg-white/10 border border-white rounded-full"
              >
                <ChevronDown className="w-8 h-8 text-white" />
              </Link>
            </div>
          </div>

          {/* 하단 정보 영역 */}
          <div className="w-full bg-black px-8 py-4">
            <div className="mb-1 mt-2 text-white/90">
              <p className="line-clamp-2 text-lg">
                {post.title}
              </p>
            </div>

            <div className="mb-2 text-slate-400">
              <p className="line-clamp-2 text-sm font-sans">
                {post.content}
              </p>
            </div>

            <div className="flex items-center gap-4 mb-1">
              <div className={`flex items-center justify-center w-12 h-7 rounded-md border border-white font-bold text-sm text-white ${
                  post.ageLimit === 18 ? "bg-red-700" : "bg-blue-700"
                }`}>
                {post.ageLimit === 0 ? "전체" : `${post.ageLimit} +`}
              </div>
              <span className="text-sm text-gray-300">
                {post.videoCount || 0}개 동영상
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {post.categories?.map((category) => (
                <span
                  key={category}
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

  return (
    <div 
      className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <link rel="preconnect" href="https://videodelivery.net" />
      <link rel="preconnect" href="https://iframe.videodelivery.net" />
      
      <div 
        className="bg-black rounded-lg overflow-hidden max-h-[90%] w-[90%] md:w-[40%] max-w-[500px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative aspect-[2/3] w-full overflow-hidden flex-shrink-0 max-h-[90vh] md:max-h-none">
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
              <video
                ref={videoRef}
                playsInline
                preload="auto"
                className="w-full h-full translate-x-2"
                autoPlay
                onLoad={() => setIsVideoReady(true)}
              />
            </div>
          )}
          
        </div>
  
        <div className="w-full bg-black pl-10 pr-10 pb-6 pt-4 overflow-y-auto flex-grow max-h-[calc(90vh)] md:max-h-none">
          <div className="flex items-center mb-4">
            <div className="flex items-center gap-3">
              {post.videos && post.videos.length > 0 && (
                <Link 
                  href={`/video-view/${post.id}`}
                  className="w-12 aspect-square flex items-center justify-center hover:bg-white/10 border border-white rounded-full"
                >
                  <Play className="size-5 text-white" />
                </Link>
              )}
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

          <div className="mb-1 text-white/90">
            <p className="line-clamp-2 text-lg">
              {post.title}
            </p>
          </div>

          <div className="mb-4 text-slate-400">
            <p className="line-clamp-2 text-sm font-sans">
              {post.content}
            </p>
          </div>

          <div className="flex items-center gap-4 mb-4">
            <div className={`flex items-center justify-center w-14 h-9 rounded-md border border-white font-bold text-sm text-white ${
                post.ageLimit === 18 ? "bg-red-700" : "bg-blue-700"
              }`}>
              {post.ageLimit === 0 ? "전체" : `${post.ageLimit} +`}
            </div>
            <span className="text-sm text-gray-300">
              {post.videoCount || 0}개 동영상
            </span>
          </div>
  
          <div className="flex flex-wrap gap-2">
            {post.categories?.map((category) => (
              <span
                key={category}
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
