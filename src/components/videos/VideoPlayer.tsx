'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';
import { useSession } from '@/components/SessionProvider';
import { videoDB } from '@/lib/indexedDB';
import { logActivity } from '@/lib/activity-logger/client';
import { isStandalonePWA } from '@/lib/pwa-client';
import { getStreamManifestUrl, getStreamThumbnailUrl } from '@/lib/constants';
import {
  getSubtitleLangCandidates,
  videoUserLanguageToSubtitleLang,
  type VideoUserLanguage,
} from '@/lib/content-language';

const VideoPlayer = dynamic(() => Promise.resolve(({ 
  videoId, 
  postId,
  sequence,
  title, 
  isActive = false, 
  onEnded, 
  onTimeUpdate,
  className, 
  userLanguage = 'KOREAN',
  initialTime = 0,
  controls = true,
  muted,
  isPremium,
}: {
  videoId: string;
  postId: string;
  sequence: number;
  title: string;
  isActive?: boolean;
  onEnded?: () => void;
  onTimeUpdate?: (time: number) => void;
  className?: string;
  userLanguage?: VideoUserLanguage;
  initialTime?: number;  
  controls?: boolean;
  muted: boolean;
  isPremium: boolean;
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const lastTrackedTimeRef = useRef<number>(0);
  const { user } = useSession();
  const isProcessingRef = useRef(false);
  const [isMuted, setIsMuted] = useState(true);
  
  const thumbnailUrl = getStreamThumbnailUrl(videoId);
  const videoUrl = getStreamManifestUrl(videoId);

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

  // 시청 시간 추적
  const handleTimeUpdate = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !isActive || !user?.id) return;
    
    const currentTime = Math.floor(video.currentTime);
    if (currentTime === 0) return;
    
    onTimeUpdate?.(currentTime);
  
    if (sequence > 1) {
      // 5초 도달 시 첫 저장
      if (currentTime >= 5 && lastTrackedTimeRef.current === 0) {
        // 이미 API 호출 중이면 스킵
        if (isProcessingRef.current) return;
        isProcessingRef.current = true;

        try {
          // 브라우저 저장
          await Promise.all([
            videoDB.saveWatchedVideo(videoId),
            videoDB.saveLastView(postId, sequence, currentTime)
          ]).catch(error => {
            console.error('IndexedDB error:', error);
          });
          
          // 유료 동영상일 때만 서버 저장
          if (isPremium) {
            const body = JSON.stringify({
              videoId,
              postId,
              sequence,
              timestamp: currentTime
            });

            let result: { message?: string };

            try {
              const response = await fetch('/api/videos/view', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body
              });

              if (!response.ok) {
                throw new Error(`View tracking failed with ${response.status}`);
              }

              result = await response.json();
            } catch (error) {
              if (isStandalonePWA() || !navigator.onLine) {
                await videoDB.queueOfflineAction({
                  url: '/api/videos/view',
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body,
                  description: `video-view:${postId}:${sequence}`,
                });
                result = { message: 'queued_offline' };
              } else {
                throw error;
              }
            }
            
            // 로그 기록
            logActivity({
              type: 'video',
              event: result.message === "SUBSCRIPTION view save" 
                ? `SubsView_${title}_${sequence}`
                : `coinview_${title}_${sequence}`,
                username: user?.username,
                details: {
                  action: videoId,
                  target: `${postId}_${sequence}`,
                  result: 'success'
                }
            });
          }
    
          console.log('First tracking at 5 seconds:', {
            videoId,
            sequence,
            currentTime
          });
    
          lastTrackedTimeRef.current = currentTime;
        } catch (error) {
          console.error('Error tracking view:', error);
          logActivity({
            type: 'video',
            event: 'view_error',
            username: user?.username,
            details: {
              action: videoId,
              target: `${postId}_${sequence}`,
              result: 'error',
              error: error instanceof Error ? error.message : 'Unknown error'
            }
          });
        } finally {
          isProcessingRef.current = false;
        }
        return;
      }

      // 이후 10초 단위로 저장
      if (currentTime >= 10) {
        const nextCheckpoint = Math.floor(currentTime / 10) * 10;
        
        if (nextCheckpoint > lastTrackedTimeRef.current) {
          console.log('Tracking at 10s checkpoint:', {
            videoId,
            sequence,
            currentTime,
            nextCheckpoint
          });
          
          // trackProgress 대신 브라우저 저장만
          videoDB.saveLastView(postId, sequence, nextCheckpoint)
            .catch(error => console.error('IndexedDB saveLastView error:', error));

          lastTrackedTimeRef.current = nextCheckpoint;
        }
      }
    }
  }, [videoId, sequence, isActive, postId, user?.id, user?.username, onTimeUpdate, title, isPremium]);

// HLS 초기화
useEffect(() => {
  const video = videoRef.current;
  if (!video) return;

  let isMounted = true;

  const initHls = async () => {
    try {
      const { default: Hls } = await import('hls.js');
      const preferredSubtitleLang = videoUserLanguageToSubtitleLang(userLanguage);
      
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90,
          enableWebVTT: true,
          enableIMSC1: true,
          enableCEA708Captions: true,
          subtitlePreference: {
            lang: preferredSubtitleLang
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
            const subtitleLangCandidates = getSubtitleLangCandidates(userLanguage);
            const selectedTrack = subtitleLangCandidates
              .map((lang) => subtitleTracks.findIndex(track => track.lang?.toLowerCase().startsWith(lang)))
              .find((trackIndex) => trackIndex !== -1) ?? -1;

            if (selectedTrack !== -1) {
              hls.subtitleTrack = selectedTrack;

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
                if (video.textTracks[selectedTrack]) {
                  const track = video.textTracks[selectedTrack];
                  track.mode = 'showing';
                  Array.from(track.cues || []).forEach((cue: any) => {
                    if (cue) {
                      cue.size = 200;  // 더 큰 크기로 설정
                      cue.snapToLines = false;
                      cue.line = 67; // 영상 아래를 0, 상단을 100으로 보았을 때 33% 높이에 위치 (상단 기준 100 - 33 = 67)
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
}, [videoUrl, userLanguage]);

// timeupdate 이벤트 리스너를 별도로 관리
useEffect(() => {
  const video = videoRef.current;
  if (!video) return;

  console.log('Setting up timeupdate listener:', {
    videoId,
    sequence,
    isActive
  });

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
    if (initialTime > 0) {
      lastTrackedTimeRef.current = Math.floor(initialTime / 10) * 10;
    } else if (video.currentTime === 0) {
      lastTrackedTimeRef.current = 0;
    }
    
    if (hlsRef.current) {
      hlsRef.current.startLoad(-1);
    }
    
    if (initialTime > 0) {
      video.currentTime = initialTime;
    } else {
      video.currentTime = 0;
    }

    if (!video.paused) {
      return;
    }

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        if (error.name !== 'AbortError') {
          console.error('Error playing video:', error);
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

    const handleEnded = () => {
      try {
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else if ((document as any).webkitFullscreenElement) {
          (document as any).webkitExitFullscreen();
        } else if ((document as any).mozFullScreenElement) {
          (document as any).mozCancelFullScreen();
        } else if ((document as any).msFullscreenElement) {
          (document as any).msExitFullscreen();
        }
  
        if ((video as any).webkitEnterFullscreen) {
          (video as any).webkitExitFullscreen();
        }
      } catch (error) {
      }
  
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
        for (let i = 0; i < track.cues.length; i++) {
          const cue = track.cues[i] as VTTCue;
          cue.size = 95;
          cue.snapToLines = false;
          // 영상 하단을 0, 상단을 100으로 보았을 때 33% 높이에 자막을 둡니다.
          // VTT의 snapToLines = false 일 때 line 값은 상단(Top) 기준의 백분율(%)이 되므로, 100 - 33 = 67% 지점(67)으로 설정합니다.
          cue.line = 67;
        }
      }
    };

    const handleLoadedMetadata = () => {
      if (video.textTracks.length > 0) {
        const subtitleLangCandidates = getSubtitleLangCandidates(userLanguage);
        const trackIndex = Array.from(video.textTracks).findIndex((track) =>
          subtitleLangCandidates.some((lang) => track.language?.toLowerCase().startsWith(lang))
        );
        const track = video.textTracks[trackIndex === -1 ? 0 : trackIndex];
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
  }, [userLanguage]);

  return (
    <div className={cn('relative w-full h-full', className)}>
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
