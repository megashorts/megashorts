'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
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
  controls = true,
  muted,
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
  controls?: boolean;
  muted: boolean;
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const lastTrackedTimeRef = useRef<number>(0);
  const { user } = useSession();
  const [isMuted, setIsMuted] = useState(true);
  
  const thumbnailUrl = `https://customer-2cdfxbmja64x0pqo.cloudflarestream.com/${videoId}/thumbnails/thumbnail.jpg?time=&height=600`;
  const videoUrl = `https://customer-2cdfxbmja64x0pqo.cloudflarestream.com/${videoId}/manifest/video.m3u8`;
  // const videoUrl = `https://customer-2cdfxbmja64x0pqo.cloudflarestream.com/${videoId}/manifest/video.m3u8?subtitleSize=200`;  // subtitleSize 파라미터 추가

  // 컴포넌트 마운트 시 localStorage에서 뮤트 상태 확인
  useEffect(() => {
    const savedMuteState = localStorage.getItem('videoMuted');
    if (savedMuteState === 'false') {
      setIsMuted(false);
    }
  }, []);

  // 뮤트 상태가 변경될 때마다 비디오 요소에 적용
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    video.muted = isMuted;
  }, [isMuted]);

  // const handleMuteToggle = (newMuteState: boolean) => {
  //   setIsMuted(newMuteState);
  // };

  // 시청 시간 추적
  // const handleTimeUpdate = () => {
  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video || !isActive || !user?.id) return;
    
    const currentTime = Math.floor(video.currentTime);
    if (currentTime === 0) return;
    
    // 현재 시간 전달
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
  }, [videoId, sequence, isActive, postId, user?.id, onTimeUpdate]);

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

              // iOS 체크 및 자막 스타일 설정
              const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
              if (isIOS) {
                // 동적 스타일 추가
                const styleElement = document.createElement('style');
                styleElement.textContent = `
                  video::-webkit-media-text-track-container { font-size: 96px !important; }
                  video::-webkit-media-text-track-display { font-size: 96px !important; }
                `;
                document.head.appendChild(styleElement);

                // 자막 트랙에 직접 스타일 적용
                if (video.textTracks[koreanTrack]) {
                  const track = video.textTracks[koreanTrack];
                  track.mode = 'showing';
                  Array.from(track.cues || []).forEach((cue: any) => {
                    if (cue) {
                      cue.size = 200;  // 더 큰 크기로 설정
                    }
                  });
                }
              }

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
  // video.removeEventListener('timeupdate', handleTimeUpdate);
  video.addEventListener('timeupdate', handleTimeUpdate);

  return () => {
    video.removeEventListener('timeupdate', handleTimeUpdate);
  };
}, [handleTimeUpdate]);

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

    // const handleEnded = () => {
    //   onEnded?.();
    // };

    const handleEnded = () => {
      try {
        // 모든 가능한 전체화면 체크 및 해제 시도
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else if ((document as any).webkitFullscreenElement) {
          (document as any).webkitExitFullscreen();
        } else if ((document as any).mozFullScreenElement) {
          (document as any).mozCancelFullScreen();
        } else if ((document as any).msFullscreenElement) {
          (document as any).msExitFullscreen();
        }
  
        // video 요소에서도 시도
        if ((video as any).webkitEnterFullscreen) {
          (video as any).webkitExitFullscreen();
        }
      } catch (error) {
        // 에러 무시 (이미 전체화면이 아닌 경우 등)
      }
  
      // 기존 onEnded 콜백 실행
      onEnded?.();
    };

    video.addEventListener('ended', handleEnded);
    return () => video.removeEventListener('ended', handleEnded);
  }, [onEnded]);

  // 자막위치 조정
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleCueChange = (event: Event) => {
      const track = event.target as TextTrack;
      if (track.cues) {

        // 화면 크기 체크
        const isDesktop = window.matchMedia('(min-width: 1024px)').matches;

        // 전체화면 상태 확인
        const isFullscreen = !!(
          document.fullscreenElement ||
          (document as any).webkitFullscreenElement ||
          (document as any).mozFullScreenElement ||
          (document as any).msFullscreenElement
        );
        
        // iOS 체크
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
        for (let i = 0; i < track.cues.length; i++) {
          const cue = track.cues[i] as VTTCue;
          cue.size = 95;
          cue.track
          
          if (isIOS) {
            if (isDesktop) {
              cue.line = 18;  // iOS 데스크톱
            } else {
              cue.line = 16;  // iOS 모바일
            }
          } else {
        // 아이폰이 아닌 경우
            if (isFullscreen) {
              // 전체화면일 때만 다른 위치 적용
              if (isDesktop) {
                cue.line = 24;  // 일반 데스크톱
              } else {
                cue.line = 16;  // 일반 모바일
              }

            } else {
              // 일반 화면일 때는 기존 위치 유지
              if (isDesktop) {
                cue.line = 21;  // 일반 데스크톱
              } else {
                cue.line = 11;  // 일반 모바일
              }
            }
          }
        }
      }
    };

    const handleLoadedMetadata = () => {
      if (video.textTracks.length > 0) {
        const track = video.textTracks[0];
        track.mode = 'showing';
        track.addEventListener('cuechange', handleCueChange);
      }
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      if (video.textTracks.length > 0) {
        const track = video.textTracks[0];
        track.removeEventListener('cuechange', handleCueChange);
      }
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, []);


  return (
    <div className={cn('relative w-full h-full', className)}>

    {/* iOS가 아닌 경우에만 스타일 적용 */}
    {!/iPad|iPhone|iPod/.test(navigator.userAgent) && (
      <style jsx global>{`
        video::cue {
          font-size: 30px;
          background-color: rgba(0, 0, 0, 0.7);
          line-height: 1.5;
        }

        ::-webkit-media-text-track-container {
          font-size: 24px !important;
        }

        ::-webkit-media-text-track-display {
          font-size: 24px !important;
          line-height: 1.5 !important;
        }
      `}</style>
    )}

      <div 
        className={cn(
          "absolute top-0 left-0 w-full h-full bg-cover bg-center",
          (isActive && isLoaded) ? "opacity-0" : "opacity-100"
        )}
        style={{ backgroundImage: `url(${thumbnailUrl})` }}
      />
      <video
        ref={videoRef}
        className={cn(
          "absolute top-0 left-0 w-full h-full",
          (isActive && isLoaded) ? "opacity-100" : "opacity-0",
          className
        )}
        playsInline
        preload="auto"
        poster={thumbnailUrl}
        controls={controls}
        muted={muted} 
        autoPlay
      />
    </div>
  );
}), {
  ssr: false
});

export default VideoPlayer;