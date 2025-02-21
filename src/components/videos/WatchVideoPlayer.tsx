// 'use client';

// import React, { useRef, useEffect, useState, useCallback } from 'react';
// import { cn } from '@/lib/utils';
// import dynamic from 'next/dynamic';
// import { videoTracking } from '@/lib/videoTracking';
// import { useSession } from '@/components/SessionProvider';

// const VideoPlayer = dynamic(() => Promise.resolve(({ 
//   videoId, 
//   postId,
//   sequence,
//   isActive = false, 
//   onEnded, 
//   onTimeUpdate,
//   className, 
//   userLanguage = 'KOREAN',
//   initialTime = 0,
//   videoRef,  // 추가
// }: {
//   videoId: string;
//   postId: string;
//   sequence: number;
//   isActive?: boolean;
//   onEnded?: () => void;
//   onTimeUpdate?: (time: number) => void;
//   className?: string;
//   userLanguage?: 'KOREAN' | 'ENGLISH' | 'JAPANESE' | 'CHINESE' | 'THAI' | 'SPANISH' | 'INDONESIAN' | 'VIETNAMESE'; 
//   initialTime?: number;
//   videoRef?: React.RefObject<HTMLVideoElement>;  // 타입 추가
// }) => {
//   const internalVideoRef = useRef<HTMLVideoElement>(null);
//   const actualVideoRef = videoRef || internalVideoRef;
//   const hlsRef = useRef<any>(null);
//   const [isLoaded, setIsLoaded] = useState(false);
//   const lastTrackedTimeRef = useRef<number>(0);
//   const { user } = useSession();
  
//   const thumbnailUrl = `https://customer-2cdfxbmja64x0pqo.cloudflarestream.com/${videoId}/thumbnails/thumbnail.jpg?time=&height=600`;
//   const videoUrl = `https://customer-2cdfxbmja64x0pqo.cloudflarestream.com/${videoId}/manifest/video.m3u8`;

//   // const handleTimeUpdate = () => {
//   const handleTimeUpdate = useCallback(() => {
//     const video = actualVideoRef.current;
//     if (!video || !isActive || !user?.id) return;
    
//     const currentTime = Math.floor(video.currentTime);
//     if (currentTime === 0) return;
    
//     onTimeUpdate?.(currentTime);

//     if (currentTime >= 3 && lastTrackedTimeRef.current === 0) {
//       videoTracking.trackView({
//         videoId,
//         postId,
//         sequence,
//         timestamp: currentTime
//       });
      
//       lastTrackedTimeRef.current = currentTime;
//       return;
//     }
    
//     if (lastTrackedTimeRef.current > 0) {
//       const nextCheckpoint = Math.floor(currentTime / 10) * 10;
      
//       if (nextCheckpoint > lastTrackedTimeRef.current) {
//         videoTracking.trackView({
//           videoId,
//           postId,
//           sequence,
//           timestamp: nextCheckpoint
//         });
        
//         lastTrackedTimeRef.current = nextCheckpoint;
//       }
//     }
//   }, [actualVideoRef, isActive, user?.id, onTimeUpdate, videoId, postId, sequence]);

//   useEffect(() => {
//     const video = actualVideoRef.current;
//     if (!video) return;

//     let isMounted = true;

//     const initHls = async () => {
//       try {
//         const { default: Hls } = await import('hls.js');
        
//         if (Hls.isSupported()) {
//           const hls = new Hls({
//             enableWorker: true,
//             lowLatencyMode: true,
//             backBufferLength: 90,
//             enableWebVTT: true,
//             enableIMSC1: true,
//             enableCEA708Captions: true,
//             subtitlePreference: {
//               lang: 'ko'
//             },
//           });
//           hlsRef.current = hls;

//           hls.attachMedia(video);

//           hls.on(Hls.Events.MEDIA_ATTACHED, () => {
//             if (isMounted) {
//               setIsLoaded(true);
//               hls.loadSource(videoUrl);
//             }
//           });

//           hls.on(Hls.Events.MANIFEST_PARSED, () => {
//             if (isMounted) {
//               const subtitleTracks = hls.subtitleTracks;
//               const koreanTrack = subtitleTracks.findIndex(track => track.lang === 'ko');
//               if (koreanTrack !== -1) {
//                 hls.subtitleTrack = koreanTrack;
//               }
//             }
//           });

//           hls.on(Hls.Events.ERROR, (_event: any, data: any) => {
//             if (data.fatal) {
//               switch (data.type) {
//                 case Hls.ErrorTypes.NETWORK_ERROR:
//                   hls.startLoad();
//                   break;
//                 case Hls.ErrorTypes.MEDIA_ERROR:
//                   hls.recoverMediaError();
//                   break;
//                 default:
//                   hls.destroy();
//                   initHls();
//                   break;
//               }
//             }
//           });
//         }
//         else if (video.canPlayType('application/vnd.apple.mpegurl')) {
//           setIsLoaded(true);
//           video.src = videoUrl;
//           video.addEventListener('loadedmetadata', () => {
//             if (isMounted) {
//               // 메타데이터 로드 완료 후 추가 처리 필요 시
//             }
//           });
//         }
//       } catch (error) {
//         console.error('Error initializing HLS:', error);
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
//   }, [videoUrl, actualVideoRef]);

//   useEffect(() => {
//     const video = actualVideoRef.current;
//     if (!video) return;

//     // video.removeEventListener('timeupdate', handleTimeUpdate);
//     video.addEventListener('timeupdate', handleTimeUpdate);

//     return () => {
//       video.removeEventListener('timeupdate', handleTimeUpdate);
//     };
//   }, [handleTimeUpdate, actualVideoRef]);

//   useEffect(() => {
//     const video = actualVideoRef.current;
//     if (!video || !isLoaded) return;

//     if (isActive) {
//       lastTrackedTimeRef.current = 0;
      
//       if (hlsRef.current) {
//         hlsRef.current.startLoad(-1);
//       }
      
//       if (initialTime > 0) {
//         video.currentTime = initialTime;
//       } else {
//         video.currentTime = 0;
//       }

//       if (!video.paused) {
//         return;
//       }

//       const playPromise = video.play();
//       if (playPromise !== undefined) {
//         playPromise.catch(error => {
//           if (error.name !== 'AbortError') {
//             console.error('Error playing video:', error);
//             setTimeout(() => {
//               if (isActive && video.paused) {
//                 video.play().catch(e => {
//                   if (e.name !== 'AbortError') {
//                     console.error('Retry failed:', e);
//                   }
//                 });
//               }
//             }, 1000);
//           }
//         });
//       }
//     } else {
//       video.pause();
//       if (hlsRef.current) {
//         hlsRef.current.stopLoad();
//       }
//       video.currentTime = 0;
//     }
//   }, [isActive, isLoaded, videoId, sequence, initialTime, actualVideoRef]);

//   useEffect(() => {
//     const video = actualVideoRef.current;
//     if (!video) return;

//     const handleEnded = () => {
//       onEnded?.();
//     };

//     video.addEventListener('ended', handleEnded);
//     return () => video.removeEventListener('ended', handleEnded);
//   }, [onEnded, actualVideoRef]);

//   return (
//     <div className={cn('relative w-full h-full', className)}>
//       <style jsx global>{`
//         @media (min-width: 768px) {
//           video::cue {
//             background-color: rgba(0, 0, 0, 0.7);
//             font-size: 30px;
//             position: relative;
//             transform: translateY(-100px);
//             line-height: 1.5;
//             padding: 4px 40px;
//           }
//         }
  
//         @media (max-width: 767px) {
//           video::cue {
//             background-color: rgba(0, 0, 0, 0.7);
//             font-size: 24px;
//             position: absolute;
//             transform: translateY(-300px);
//             line-height: 1.5;
//             padding: 4px 8px;
//           }
//         }
//       `}</style>
//       <div 
//         className={cn(
//           "absolute top-0 left-0 w-full h-full bg-cover bg-center",
//           (isActive && isLoaded) ? "opacity-0" : "opacity-100"
//         )}
//         style={{ backgroundImage: `url(${thumbnailUrl})` }}
//       />
// <video
//   ref={videoRef}
//   className={cn(
//     "absolute top-0 left-0 w-full h-full",
//     (isActive && isLoaded) ? "opacity-100" : "opacity-0",
//     className
//   )}
//   playsInline
//   webkit-playsinline="true"
//   x5-playsinline="true"
//   x5-video-player-type="h5"
//   x5-video-player-fullscreen="true"
//   x5-video-orientation="portraint"
//   autoPlay
//   muted
//   preload="auto"
//   poster={thumbnailUrl}
//   style={{ 
//     WebkitUserSelect: 'none',
//     userSelect: 'none',
//     WebkitTouchCallout: 'none',
//     touchAction: 'manipulation'
//   }}
// />
//     </div>
//   );
// }), {
//   ssr: false
// });

// export default VideoPlayer;