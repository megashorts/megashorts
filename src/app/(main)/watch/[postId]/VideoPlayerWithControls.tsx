// 'use client';

// import { useState, useCallback } from 'react';
// import VideoPlayer from "@/components/videos/VideoPlayer";
// import VideoControls from "@/components/videos/VideoControls";
// import { toast } from "@/components/ui/use-toast";

// interface VideoData {
//   id: string;
//   url: string;
//   postId: string;
//   title: string;
//   content: string;
//   totalVideos: number;
//   currentVideoIndex: number;
// }

// interface ControlsData {
//   postId: string;
//   bookmarkState: {
//     isBookmarkedByUser: boolean;
//   };
//   likeState: {
//     likes: number;
//     isLikedByUser: boolean;
//   };
// }

// interface VideoPlayerWithControlsProps {
//   videoData: VideoData;
//   controlsData: ControlsData | null;
// }

// export default function VideoPlayerWithControls({
//   videoData,
//   controlsData
// }: VideoPlayerWithControlsProps) {
//   const [showControls, setShowControls] = useState(true);

//   const handleNavigate = useCallback((direction: 'next' | 'prev') => {
//     if (direction === 'next' && videoData.currentVideoIndex >= videoData.totalVideos - 1) {
//       toast({
//         description: "마지막 영상입니다.",
//       });
//       return;
//     }
//     if (direction === 'prev' && videoData.currentVideoIndex <= 0) {
//       toast({
//         description: "첫 번째 영상입니다.",
//       });
//       return;
//     }
//     // 추후 네비게이션 구현
//   }, [videoData.currentVideoIndex, videoData.totalVideos]);

//   return (
//     <>
//       {/* 모바일에서 네비바 영역을 가릴 오버레이 */}
//       <div className={`absolute inset-x-0 top-0 h-16 bg-black md:hidden z-10 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`} />
//       <div className={`absolute inset-x-0 bottom-0 h-16 bg-black md:hidden z-10 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`} />

//       <div className="relative h-full flex items-center justify-center py-4 md:py-8">
//         <VideoPlayer
//           videoId={videoData.id}
//           url={videoData.url}
//           isActive={true}
//           showControls={showControls}
//           className="w-full h-full object-contain md:object-cover"
//           onControlsChange={setShowControls}
//         />

//         {controlsData && (
//           <VideoControls
//             postId={controlsData.postId}
//             postTitle={videoData.title}
//             postContent={videoData.content}
//             initialBookmarkState={controlsData.bookmarkState}
//             initialLikeState={controlsData.likeState}
//             hasNextVideo={videoData.currentVideoIndex < videoData.totalVideos - 1}
//             hasPrevVideo={videoData.currentVideoIndex > 0}
//             onNavigate={handleNavigate}
//             visible={showControls}
//           />
//         )}
//       </div>
//     </>
//   );
// }