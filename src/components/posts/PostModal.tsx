"use client";

import { useSession } from "@/components/SessionProvider";
import { PostData } from "@/lib/types";
import { X, Play, ChevronDown } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
// import LikeButton from "./LikeButton";
import BookmarkButton from "./BookmarkButton";
import LikeButton from "./LikeButtonOnly";
import { getThumbnailUrl, getStreamManifestUrl } from "@/lib/constants";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { getLocalizedPostContent, getLocalizedPostTitle } from "@/lib/content-language";
import LanguageFlag from "@/components/LanguageFlag";
import { Language } from "@prisma/client";

interface PostModalProps {
  post: PostData;
  ageLimit?: number;
  handleClose: () => void;
}

export default function PostModal({ post, handleClose }: PostModalProps) {
  const { user } = useSession();
  const t = useTranslations('Category');
  const tContent = useTranslations('Content');
  const locale = useLocale();
  const localizedTitle = getLocalizedPostTitle(post, locale);
  const localizedContent = getLocalizedPostContent(post, locale);
  const [showPreview, setShowPreview] = useState(true);
  const [isVideoReady, setIsVideoReady] = useState(false);

  const firstVideoId = post.videos?.[0]?.id;
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

          const videoUrl = getStreamManifestUrl(firstVideoId);
          hls.loadSource(videoUrl);
          hls.attachMedia(video);

          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            if (isMounted) {
              let playPromise = video.play();
              playPromise
                .then(() => {
                  setIsVideoReady(true);
                })
                .catch(error => {
                  // AbortError는 무시 (정상적인 상황)
                  if (error.name !== 'AbortError') {
                    console.error('Error playing video:', error);
                  }
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
          video.src = getStreamManifestUrl(firstVideoId);
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

  return (
    <div 
      className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <link rel="preconnect" href="https://videodelivery.net" />
      <link rel="preconnect" href="https://iframe.videodelivery.net" />
      
      <div 
        className="bg-black rounded-lg overflow-hidden w-[min(92vw,calc(52dvh*2/3))] max-w-[420px] max-h-[90dvh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative w-full pt-3 flex-shrink-0">
          <div className="relative aspect-[2/3] w-full overflow-hidden rounded-md">
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
              src={getThumbnailUrl(post.thumbnailId)}
              alt={`타이틀 ${localizedTitle} - ${post.categories || ''} 컨텐츠의 대표 이미지`}
              fill
              sizes="(max-width: 768px) 90vw, (max-width: 1200px) 40vw, 500px"  // 컨테이너 크기에 맞게 설정
              className="object-cover"
            />
            
          </div>

          {(showPreview && firstVideoId) && (
            <div 
              className={`absolute inset-0 flex items-center justify-center transition-opacity duration-500 ${
                isVideoReady ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <video
                ref={videoRef}
                playsInline
                preload="auto"
                className="w-full h-full object-cover"
                autoPlay
                onLoad={() => setIsVideoReady(true)}
              />
            </div>
          )}
          </div>
        </div>
  
        <div className="w-full bg-black px-5 sm:px-8 pb-6 pt-4 overflow-y-auto min-h-0 flex-1">
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
                href={`/${locale}/posts/${post.id}`}
                prefetch={false}
                className="w-12 aspect-square flex items-center justify-center hover:bg-white/10 border border-white rounded-full"
              >
                <ChevronDown className="w-8 h-8 text-white" />
              </Link>
            </div>
          </div>

          <div className="w-[98%] mx-auto border-t border-white/15 mb-5"></div>

          <div className="mb-1 text-white/90">
            <p className="line-clamp-2 text-lg">
              {localizedTitle}
            </p>
          </div>

          <div className="mb-4 text-slate-400">
            <p className="line-clamp-2 text-sm font-sans">
              {localizedContent}
            </p>
          </div>

          <div className="flex items-center gap-4 mb-4">
            <div className={`flex items-center justify-center w-14 h-9 rounded-md border border-white font-bold text-sm text-white ${
                post.ageLimit === 18 ? "bg-red-700" : "bg-blue-700"
              }`}>
              {post.ageLimit === 0 ? "전체" : `${post.ageLimit} +`}
            </div>
            <div className="text-sm text-gray-300 min-w-0 flex items-center gap-2 flex-wrap">
              <span>{tContent('videoCount', { count: post.videoCount || 0 })}</span>
              {post.postLanguage && (
                <>
                  <span>-</span>
                  <LanguageFlag language={post.postLanguage as Language} className="relative top-[1px]" />
                  {post.videos?.[0]?.subtitle?.length > 0 && (
                    <>
                      <span>/</span>
                      <div className="inline-flex items-center gap-1.5">
                        {post.videos[0].subtitle.map((lang: Language) => (
                          <LanguageFlag key={lang} language={lang} className="relative top-[1px]" />
                        ))}
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
  
          <div className="flex flex-wrap gap-2">
            {post.categories?.map((category) => (
              <span
                key={category}
                className="flex items-center py-2 rounded-sm text-muted-foreground text-xs"
              >
                #{t(category)}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
