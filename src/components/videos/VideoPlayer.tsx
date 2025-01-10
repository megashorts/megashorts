'use client';

import React, { useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';
import { videoTracking } from '@/lib/videoTracking';
import { useSession } from '@/components/SessionProvider';

const VideoPlayer = dynamic(() => Promise.resolve(({ 
  videoId, 
  postId,
  sequence,
  isActive = false, 
  onEnded, 
  onTimeUpdate,
  className, 
  userLanguage = 'KOREAN',
  initialTime = 0,
}: {
  videoId: string;
  postId: string;
  sequence: number;
  isActive?: boolean;
  onEnded?: () => void;
  onTimeUpdate?: (time: number) => void;
  className?: string;
  userLanguage?: 'KOREAN' | 'ENGLISH' | 'JAPANESE' | 'CHINESE' | 'THAI' | 'SPANISH' | 'INDONESIAN' | 'VIETNAMESE'; 
  initialTime?: number;  
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const lastTrackedTimeRef = useRef<number>(0);
  const { user } = useSession();
  
  const thumbnailUrl = `https://customer-2cdfxbmja64x0pqo.cloudflarestream.com/${videoId}/thumbnails/thumbnail.jpg?time=&height=600`;
  const videoUrl = `https://customer-2cdfxbmja64x0pqo.cloudflarestream.com/${videoId}/manifest/video.m3u8`;

  // 시청 시간 추적
  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || !isActive || !user?.id) return;
    
    const currentTime = Math.floor(video.currentTime);
    if (currentTime === 0) return;
    
    // console.log('Time update:', {
    //   isActive,
    //   videoId,
    //   sequence,
    //   currentTime,
    //   lastTrackedTime: lastTrackedTimeRef.current
    // });
    
    // 현재 시간 전달 (기존 기능에 영향 없음)
    onTimeUpdate?.(currentTime);

    // 3초 도달 시 첫 저장
    if (currentTime >= 3 && lastTrackedTimeRef.current === 0) {
      console.log('First tracking at 3 seconds:', {
        videoId,
        sequence,
        currentTime
      });
      
      videoTracking.trackView({
        videoId,
        postId,
        sequence,
        timestamp: currentTime
      });
      
      lastTrackedTimeRef.current = currentTime;
      return;
    }
    
    // 이후 10초 단위로 저장
    if (lastTrackedTimeRef.current > 0) {
      const nextCheckpoint = Math.floor(currentTime / 10) * 10;
      
      if (nextCheckpoint > lastTrackedTimeRef.current) {
        console.log('Tracking at 10s checkpoint:', {
          videoId,
          sequence,
          currentTime,
          nextCheckpoint
        });
        
        videoTracking.trackView({
          videoId,
          postId,
          sequence,
          timestamp: nextCheckpoint
        });
        
        lastTrackedTimeRef.current = nextCheckpoint;
      }
    }
  };

// HLS 초기화
useEffect(() => {
  const video = videoRef.current;
  if (!video) return;

  let isMounted = true;

  const initHls = async () => {
    try {
      const { default: Hls } = await import('hls.js');
      
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90,
          // 자막 관련 설정
          enableWebVTT: true,
          enableIMSC1: true,
          enableCEA708Captions: true,
          subtitlePreference: {
            lang: 'ko'  // 한국어 자막 선호
          },
        });
        hlsRef.current = hls;

        hls.loadSource(videoUrl);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (isMounted) {
            setIsLoaded(true);
            // 자막 트랙 설정
            const subtitleTracks = hls.subtitleTracks;
            const koreanTrack = subtitleTracks.findIndex(track => track.lang === 'ko');
            if (koreanTrack !== -1) {
              hls.subtitleTrack = koreanTrack;
            }
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
        video.src = videoUrl;
        video.addEventListener('loadedmetadata', () => {
          if (isMounted) {
            setIsLoaded(true);
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
}, [videoUrl]);

// timeupdate 이벤트 리스너를 별도로 관리
useEffect(() => {
  const video = videoRef.current;
  if (!video) return;

  console.log('Setting up timeupdate listener:', {
    videoId,
    sequence,
    isActive
  });

  // 이전 리스너 제거 후 새로 등록
  video.removeEventListener('timeupdate', handleTimeUpdate);
  video.addEventListener('timeupdate', handleTimeUpdate);

  return () => {
    video.removeEventListener('timeupdate', handleTimeUpdate);
  };
}, [videoId, sequence, isActive, postId, user?.id]);

// 재생 제어
useEffect(() => {
  const video = videoRef.current;
  if (!video || !isLoaded) return;

  console.log('Playback control:', {
    isActive,
    videoId,
    sequence,
    isLoaded
  });

  if (isActive) {
    // 재생 시작 시 lastTrackedTimeRef 초기화
    lastTrackedTimeRef.current = 0;
    
    if (hlsRef.current) {
      hlsRef.current.startLoad(-1);
    }
    
    // initialTime이 있을 때만 적용
    if (initialTime > 0) {
      video.currentTime = initialTime;
    } else {
      video.currentTime = 0;
    }

    // play() 호출 전에 현재 상태 확인
    if (!video.paused) {
      return; // 이미 재생 중이면 스킵
    }

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        // AbortError는 의도된 동작이므로 무시
        if (error.name !== 'AbortError') {
          console.error('Error playing video:', error);
          // 실제 에러일 경우만 재시도
          setTimeout(() => {
            if (isActive && video.paused) {
              video.play().catch(e => {
                if (e.name !== 'AbortError') {
                  console.error('Retry failed:', e);
                }
              });
            }
          }, 1000);
        }
      });
    }

    // video.play().catch(error => {
    //   console.error('Error playing video:', error);
    //   // 재생 실패 시 재시도
    //   setTimeout(() => {
    //     if (isActive) {
    //       video.play().catch(console.error);
    //     }
    //   }, 1000);
    // });
  } else {
    video.pause();
    if (hlsRef.current) {
      hlsRef.current.stopLoad();
    }
    video.currentTime = 0;
  }
}, [isActive, isLoaded, videoId, sequence, initialTime]);

  // 종료 이벤트
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleEnded = () => {
      onEnded?.();
    };

    video.addEventListener('ended', handleEnded);
    return () => video.removeEventListener('ended', handleEnded);
  }, [onEnded]);

  return (
    <div className={cn('relative w-full h-full', className)}>
      <style jsx global>{`
        @media (min-width: 768px) {
          video::cue {
            background-color: rgba(0, 0, 0, 0.7);
            font-size: 30px;
            position: relative;
            transform: translateY(-100px);
            line-height: 1.5;
            padding: 4px 40px;
          }
        }

        @media (max-width: 767px) {
          video::cue {
            background-color: rgba(0, 0, 0, 0.7);
            font-size: 24px;
            position: absolute;
            transform: translateY(-300px);
            line-height: 1.5;
            padding: 4px 8px;
          }
        }
      `}</style>
      <div 
        className={cn(
          "absolute top-0 left-0 w-full h-full bg-cover bg-center transition-opacity duration-300",
          (isActive && isLoaded) ? "opacity-0" : "opacity-100"
        )}
        style={{ backgroundImage: `url(${thumbnailUrl})` }}
      />
      <video
        ref={videoRef}
        className={cn(
          "absolute top-0 left-0 w-full h-full transition-opacity duration-300 pt-10 md:pt-0 pb-4 md:pb-0",
          (isActive && isLoaded) ? "opacity-100" : "opacity-0",
          className
        )}
        playsInline
        preload="auto"
        poster={thumbnailUrl}
        controls
      />
    </div>
  );
}), {
  ssr: false
});

export default VideoPlayer;

// 'use client';

// import React, { useRef, useEffect, useState } from 'react';
// import { cn } from '../../lib/utils';
// import dynamic from 'next/dynamic';

// // 클라이언트 사이드에서만 렌더링되도록 설정
// const VideoPlayer = dynamic(() => Promise.resolve(({ 
//   videoId, 
//   isActive = false, 
//   onEnded, 
//   className, 
//   userLanguage = 'KOREAN'
// }: {
//   videoId: string;
//   isActive?: boolean;
//   onEnded?: () => void;
//   className?: string;
//   userLanguage?: 'KOREAN' | 'ENGLISH' | 'JAPANESE' | 'CHINESE' | 'THAI' | 'SPANISH' | 'INDONESIAN' | 'VIETNAMESE'; 
// }) => {
//   const videoRef = useRef<HTMLVideoElement>(null);
//   const hlsRef = useRef<any>(null);
//   const [isLoaded, setIsLoaded] = useState(false);
//   const playPromiseRef = useRef<Promise<void> | null>(null);
  
//   const thumbnailUrl = `https://customer-2cdfxbmja64x0pqo.cloudflarestream.com/${videoId}/thumbnails/thumbnail.jpg?time=&height=600`;
//   const videoUrl = `https://customer-2cdfxbmja64x0pqo.cloudflarestream.com/${videoId}/manifest/video.m3u8`;

//   // HLS 초기화는 클라이언트 사이드에서만 실행
//   useEffect(() => {
//     let isMounted = true;

//     const initHls = async () => {
//       const video = videoRef.current;
//       if (!video || !isMounted) return;

//       try {
//         const { default: Hls } = await import('hls.js');
        
//         if (Hls.isSupported()) {
//           if (hlsRef.current) {
//             hlsRef.current.destroy();
//           }

//           const hls = new Hls({
//             enableWorker: true,
//             lowLatencyMode: true,
//             backBufferLength: 90,
//             // 자막 관련 설정
//             enableWebVTT: true,
//             enableIMSC1: true,
//             enableCEA708Captions: true,
//             subtitlePreference: {
//               lang: 'ko'  // 한국어 자막 선호
//             },
//           });

//           hls.attachMedia(video);
//           hls.on(Hls.Events.MEDIA_ATTACHED, () => {
//             if (isMounted) {
//               hls.loadSource(videoUrl);
//             }
//           });

//           hls.on(Hls.Events.MANIFEST_PARSED, () => {
//             if (isMounted) {
//               setIsLoaded(true);
//               const subtitleTracks = hls.subtitleTracks;
//               const koreanTrack = subtitleTracks.findIndex(track => track.lang === 'ko');
//               if (koreanTrack !== -1) {
//                 hls.subtitleTrack = koreanTrack;
//               }
//             }
//           });

//           hls.on(Hls.Events.ERROR, (_event: any, data: any) => {
//             if (!isMounted) return;

//             if (data.fatal) {
//               switch (data.type) {
//                 case Hls.ErrorTypes.NETWORK_ERROR:
//                   hls.startLoad();
//                   break;
//                 case Hls.ErrorTypes.MEDIA_ERROR:
//                   hls.recoverMediaError();
//                   break;
//                 default:
//                   if (isMounted) {
//                     initHls();
//                   }
//                   break;
//               }
//             }
//           });

//           hlsRef.current = hls;
//         }
//         else if (video.canPlayType('application/vnd.apple.mpegurl')) {
//           video.src = videoUrl;
//           video.addEventListener('loadedmetadata', () => {
//             if (isMounted) {
//               setIsLoaded(true);
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
//       const video = videoRef.current;
//       if (video) {
//         video.pause();
//         video.src = '';
//         video.load();
//       }
//     };
//   }, [videoUrl]);

//   // 비디오 재생 제어
//   useEffect(() => {
//     const video = videoRef.current;
//     if (!video || !isLoaded) return;

//     let isMounted = true;

//     const handlePlay = async () => {
//       try {
//         if (!video.paused) return;

//       // 재생 시도 전에 currentTime 리셋
//       video.currentTime = 0;

//         // 이거 추가해봄. 에러 해결은 안되었음
//         if (playPromiseRef.current) {
//           await playPromiseRef.current;
//         }

//         if (isMounted) {
//           playPromiseRef.current = video.play();
//           await playPromiseRef.current;
//           playPromiseRef.current = null;
//         }
//       } catch (error) {
//         if (error instanceof Error && error.name !== 'AbortError') {
//           console.error('Error playing video:', error);
//         }
//         playPromiseRef.current = null;
//       }
//     };

//     const handleStop = async () => {
//       try {
//         if (playPromiseRef.current) {
//           await playPromiseRef.current;
//         }

//         if (isMounted) {
//           video.pause();
//           video.currentTime = 0;
//         }
//       } catch (error) {
//         console.error('Error stopping video:', error);
//       }
//     };

//     if (isActive) {
//       handlePlay();
//     } else {
//       handleStop();
//     }

//     return () => {
//       isMounted = false;
//     };
//   }, [isActive, isLoaded]);

//   // 비디오 종료 이벤트
//   useEffect(() => {
//     const video = videoRef.current;
//     if (!video) return;

//     const handleEnded = () => {
//       onEnded?.();
//     };

//     video.addEventListener('ended', handleEnded);
//     return () => video.removeEventListener('ended', handleEnded);
//   }, [onEnded]);

//   return (
//     <div className={cn('relative w-full h-full', className)}>
//     <style jsx global>{`
//       /* 데스크톱 자막 스타일 */
//       @media (min-width: 768px) {
//         video::cue {
//           background-color: rgba(0, 0, 0, 0.7);
//           font-size: 30px;
//           position: relative;
//           transform: translateY(-100px);
//           line-height: 1.5;
//           padding: 4px 40px;
//         }
//       }

//       /* 모바일 자막 스타일 */
//       @media (max-width: 767px) {
//         video::cue {
//           background-color: rgba(0, 0, 0, 0.7);
//           font-size: 30px;
//           position: absolute;
//           transform: translateY(-300px);  // 모바일에서는 더 높게
//           line-height: 1.5;
//           padding: 4px 8px;
//         }
//       }
//     `}</style>
//       <div 
//         className={cn(
//           "absolute top-0 left-0 w-full h-full bg-cover bg-center transition-opacity duration-300",
//           (isActive && isLoaded) ? "opacity-0" : "opacity-100"
//         )}
//         style={{ backgroundImage: `url(${thumbnailUrl})` }}
//       />
//       <video
//         ref={videoRef}
//         className={cn(
//           "absolute top-0 left-0 w-full h-full transition-opacity duration-300",
//           (isActive && isLoaded) ? "opacity-100" : "opacity-0",
//           className  // 부모로부터 전달받은 className 사용
//         )}
//         playsInline
//         preload="auto"
//         poster={thumbnailUrl}
//         controls
//       />
//     </div>
//   );
// }), {
//   ssr: false // 클라이언트 사이드에서만 렌더링
// });

// export default VideoPlayer;