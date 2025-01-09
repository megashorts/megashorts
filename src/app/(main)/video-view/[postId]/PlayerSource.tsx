// 'use client';

// import { useEffect, useRef } from 'react';
// import { cn } from '@/lib/utils';
// import { Language } from '@prisma/client';

// interface VideoPlayerProps {
//   videoId: string;
//   url: string;
//   isActive: boolean;
//   className?: string;
// }

// export default function VideoPlayer({ videoId, url, isActive, className }: VideoPlayerProps) {
//   const iframeRef = useRef<HTMLIFrameElement>(null);

//   const getStreamInfo = (url: string) => {
//     const parts = url.split('/');
//     return {
//       domain: parts[2],
//       streamId: parts[3]
//     };
//   };

//   useEffect(() => {
//     const iframe = iframeRef.current;
//     if (!iframe?.contentWindow) return;

//     if (!isActive) {
//       iframe.contentWindow.postMessage({ type: 'player.pause' }, '*');
//     }
//   }, [isActive]);

//   const { domain, streamId } = getStreamInfo(url);
//   const iframeUrl = new URL(`https://${domain}/${streamId}/iframe`);

//   const userLanguage = 'KOREAN';
//   const getLanguageCode = (lang: Language): string => {
//     switch (lang) {
//       case 'KOREAN': return 'ko';
//       case 'ENGLISH': return 'en';
//       case 'JAPANESE': return 'ja';
//       case 'CHINESE': return 'zh';
//       case 'THAI': return 'th';
//       case 'SPANISH': return 'es';
//       case 'INDONESIAN': return 'id';
//       case 'VIETNAMESE': return 'vi';
//       default: return 'ko';
//     }
//   };

//   iframeUrl.searchParams.set('autoplay', 'true');
//   iframeUrl.searchParams.set('controls', 'true');
//   // iframeUrl.searchParams.set('defaultTextTrack', 'ko');
//   iframeUrl.searchParams.set('defaultTextTrack', getLanguageCode(userLanguage));
//   iframeUrl.searchParams.set('preload', 'auto');

//   return (
//     <div className={cn('relative w-full h-full bg-black', className)}>
//       <iframe
//         ref={iframeRef}
//         src={iframeUrl.toString()}
//         className="absolute top-0 left-0 w-full h-full border-0"
//         allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
//         allowFullScreen
//       />
//     </div>
//   );
// }