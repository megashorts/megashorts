'use client';

import { cn } from "@/lib/utils";
import { Video, VideoView } from "@prisma/client";
import Link from "next/link";

interface VideoButtonsProps {
  videos: (Video & {
    views: VideoView[];
  })[];
  userId?: string;
  postId: string;  // postId 추가
  onVideoSelect: (sequence: number) => void;
}

export default function VideoButtons({ videos, userId, postId, onVideoSelect }: VideoButtonsProps) {
  const sortedVideos = [...videos].sort((a, b) => a.sequence - b.sequence);

  return (
    <div className="w-full">
      <div className="grid grid-cols-8 sm:grid-cols-10 md:grid-cols-14 lg:grid-cols-20 gap-2">
        {sortedVideos.map((video) => {
          const isWatched = userId && video.views.some(view => view.userId === userId);
          const isPremium = video.isPremium;

          return (
            <Link
              key={video.id}
              href={`/video-view/${postId}?sequence=${video.sequence}`}  // postId 사용
              className="block"
            >
              <button
                onClick={() => onVideoSelect(video.sequence)}
                className={cn(
                  "relative w-full aspect-square rounded text-xs font-medium transition-colors",
                  isWatched
                    ? "bg-gray-300 hover:bg-gray-400"
                    : isPremium
                      ? "bg-primary/90 hover:bg-primary/100"
                      : "border-2 border-red-500 bg-white hover:bg-gray-100 text-black",
                  "flex items-center justify-center"
                )}
              >
                <span>{video.sequence}</span>
              </button>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// 'use client';

// import { cn } from "@/lib/utils";
// import { Video, VideoView } from "@prisma/client";
// import { Lock } from "lucide-react";

// interface VideoButtonsProps {
//   videos: (Video & {
//     views: VideoView[];
//   })[];
//   userId?: string;
//   onVideoSelect: (sequence: number) => void;
// }

// export default function VideoButtons({ videos, userId, onVideoSelect }: VideoButtonsProps) {
//   const sortedVideos = [...videos].sort((a, b) => a.sequence - b.sequence);

//   return (
//   <div className="w-full">
//     <div className="grid grid-cols-8 sm:grid-cols-10 md:grid-cols-14 lg:grid-cols-20 gap-2">
//       {sortedVideos.map((video) => {
//         const isWatched = userId && video.views.some(view => view.userId === userId);
//         const isPremium = video.isPremium;

//         return (
//           <button
//             key={video.id}
//             onClick={() => onVideoSelect(video.sequence)}
//             className={cn(
//               "relative w-full aspect-square rounded text-xs font-medium transition-colors",
//               isWatched
//                 ? "bg-gray-300 hover:bg-gray-400" // 음영을 주어 본 콘텐츠와 구분
//                 : isPremium
//                   ? "bg-primary/90 hover:bg-primary/100"
//                   : "border-2 border-red-500 bg-white hover:bg-gray-100 text-black", // 비프리미엄 버튼 스타일
//               "flex items-center justify-center"
//             )}
//           >
//             <span>{video.sequence}</span>
//           </button>
//         );
//       })}
//     </div>
//   </div>
//   );
// }
