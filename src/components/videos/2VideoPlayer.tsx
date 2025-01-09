// 'use client';

// import React, { useRef, useState, useEffect } from 'react';
// import { cn } from '@/lib/utils';
// import { useVideoStore } from '@/store/videoStore';
// import { Language } from '@prisma/client';

// interface VideoPlayerProps {
//   videoId: string;
//   url: string;
//   postId: string;
//   isActive?: boolean;
//   showControls?: boolean;
//   onEnded?: () => void;
//   className?: string;
//   userLanguage?: Language;
//   autoPlay?: boolean;
//   videoIndex?: number;
// }

// export default function VideoPlayer({ 
//   videoId, 
//   url,
//   postId,
//   isActive = false,
//   showControls = false,
//   onEnded,
//   className,
//   videoIndex = 0
// }: VideoPlayerProps) {
//   console.log('=== VideoPlayer Initialization ===');
//   console.log('Props:', {
//     videoId,
//     url,
//     postId,
//     isActive,
//     showControls,
//     videoIndex
//   });

//   const videoRef = useRef<HTMLVideoElement>(null);
//   const hlsRef = useRef<any>(null);
//   const lastSaveTimeRef = useRef<number>(0);  // 마지막 저장 시간 추적
//   const [isLoaded, setIsLoaded] = useState(false);
//   const [showResumePrompt, setShowResumePrompt] = useState(false);
//   const { setVideoProgress, getVideoProgress } = useVideoStore();

//   // 이어보기 체크
//   useEffect(() => {
//     const checkProgress = async () => {
//       if (!videoRef.current || !isActive || !isLoaded) return;
      
//       const savedProgress = await getVideoProgress(postId);
//       if (savedProgress?.timestamp && savedProgress.timestamp > 0) {
//         setShowResumePrompt(true);
//       }
//     };
    
//     checkProgress();
//   }, [postId, isActive, isLoaded]);

//   // HLS 초기화
//   useEffect(() => {
//     let isMounted = true;

//     const initHls = async () => {
//       const video = videoRef.current;
//       if (!video || !isMounted) return;

//       try {
//         const Hls = (await import('hls.js')).default;
        
//         if (Hls.isSupported()) {
//           if (hlsRef.current) {
//             hlsRef.current.destroy();
//           }

//           const hls = new Hls({
//             enableWorker: true,
//             lowLatencyMode: true,
//             backBufferLength: 90,
//             maxBufferSize: 20 * 1000 * 1000,
//             maxBufferLength: 30,
//             manifestLoadingRetryDelay: 1000,
//             manifestLoadingMaxRetry: 4,
//             levelLoadingRetryDelay: 1000,
//             levelLoadingMaxRetry: 4,
//             fragLoadingRetryDelay: 1000,
//             fragLoadingMaxRetry: 4
//           });

//           hls.attachMedia(video);
//           hls.on(Hls.Events.MEDIA_ATTACHED, () => {
//             if (isMounted) {
//               hls.loadSource(url);
//             }
//           });

//           hls.on(Hls.Events.MANIFEST_PARSED, () => {
//             if (isMounted) {
//               setIsLoaded(true);
//               video.muted = true;
//               if (isActive) {
//                 setTimeout(() => {
//                   checkAndResumePlayback();
//                 }, 100);
//               }
//             }
//           });

//           hlsRef.current = hls;
//         } else {
//           video.src = url;
//           video.addEventListener('loadedmetadata', () => {
//             if (isMounted) {
//               setIsLoaded(true);
//               video.muted = true;
//               if (isActive) {
//                 checkAndResumePlayback();
//               }
//             }
//           });
//         }
//       } catch (error) {
//         console.error('HLS init error:', error);
//       }
//     };

//     initHls();

//     return () => {
//       isMounted = false;
//       if (hlsRef.current) {
//         hlsRef.current.destroy();
//         hlsRef.current = null;
//       }
//     };
//   }, [url, isActive]);

//   // 진행상태 저장 - 수정된 부분
//   useEffect(() => {
//     console.log('=== ㄴㅁㅍㄷ ㅔ갷ㄱㄷㄴㄴ ===');
//     const video = videoRef.current;
//     if (!video || !isLoaded) return;

//     const MIN_SAVE_INTERVAL = 10000; // 10초

//     const saveProgress = (currentTime: number) => {
//       const now = Date.now();
//       if (now - lastSaveTimeRef.current < MIN_SAVE_INTERVAL) return;
      
//       lastSaveTimeRef.current = now;
//       setVideoProgress(postId, videoId, videoIndex, currentTime);
//     };

//     const handleTimeUpdate = () => {
//       requestAnimationFrame(() => {
//         saveProgress(video.currentTime);
//       });
//     };

//     const handleEnded = () => {
//       saveProgress(video.duration);
//       onEnded?.();
//     };

//     video.addEventListener('timeupdate', handleTimeUpdate);
//     video.addEventListener('ended', handleEnded);

//     return () => {
//       video.removeEventListener('timeupdate', handleTimeUpdate);
//       video.removeEventListener('ended', handleEnded);
//       if (video.currentTime > 0) {
//         saveProgress(video.currentTime);
//       }
//     };
//   }, [videoId, postId, videoIndex, isLoaded, onEnded]);

//   const checkAndResumePlayback = async () => {
//     const video = videoRef.current;
//     if (!video || !isLoaded) return;
    
//     try {
//       const savedProgress = await getVideoProgress(postId);
//       if (!savedProgress) {
//         await video.play();
//         return;
//       }
  
//       if (savedProgress.timestamp && savedProgress.timestamp > 0) {
//         setShowResumePrompt(true);
//       } else {
//         await video.play();
//       }
//     } catch (error) {
//       console.error('재생 시작 실패:', error);
//     }
//   };

//   const handleResumeClick = async () => {
//     if (!videoRef.current) return;

//     const savedProgress = await getVideoProgress(postId);
//     if (savedProgress?.timestamp) {
//       videoRef.current.currentTime = savedProgress.timestamp;
//       videoRef.current.play().catch(error => {
//         console.error('이어보기 실패:', error);
//       });
//     }
//     setShowResumePrompt(false);
//   };

//   return (
//     <div className={cn('relative w-full h-full', className)}>
//       {showResumePrompt && (
//         <div className="absolute top-12 left-2 md:top-10 md:left-10 z-10 bg-black/80 p-4 rounded-lg">
//           <p className="text-white mb-2">이전에 시청하던 부분부터 이어보시겠습니까?</p>
//           <div className="flex gap-2">
//             <button
//               className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
//               onClick={handleResumeClick}
//             >
//               이어보기
//             </button>
//             <button
//               className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
//               onClick={() => {
//                 setShowResumePrompt(false);
//                 videoRef.current?.play().catch(error => {
//                   console.error('재생 시작 실패:', error);
//                 });
//               }}
//             >
//               처음부터
//             </button>
//           </div>
//         </div>
//       )}
//       <video
//         ref={videoRef}
//         className={cn("w-full h-full relative z-[5]", className)}
//         playsInline
//         preload="auto"
//         controls={showControls}
//         muted
//       />
//     </div>
//   );
// }
