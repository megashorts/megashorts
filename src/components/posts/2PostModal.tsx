// "use client";

// import { useSession } from "@/app/(main)/SessionProvider";
// import { PostData } from "@/lib/types";
// import { X, Play, ChevronDown } from "lucide-react";
// import Image from "next/image";
// import Link from "next/link";
// // import LikeButton from "./LikeButton";
// import BookmarkButton from "./BookmarkButton";
// import { cn } from "@/lib/utils";
// import LikeButton from "./LikeButtonOnly";
// import { getCategoryName } from "@/lib/constants";
// import { useEffect, useRef, useState } from "react";
// import VideoPlayer from "../videos/VideoPlayer";

// interface PostModalProps {
//   post: PostData;
//   handleClose: () => void;
// }

// export default function PostModal({ post, handleClose }: PostModalProps) {
//   const { user } = useSession();
//   const [showPreview, setShowPreview] = useState(true);
//   const [isVideoReady, setIsVideoReady] = useState(false);
  
//   // 디버깅을 위해 videos 데이터 출력
//   console.log('Videos data:', post.videos);

//   function getVideoId(url: string | undefined): string | null {
//     if (!url) return null;
    
//     console.log('Video URL to parse:', url);
    
//     // URL이 undefined가 아닌 경우에만 처리
//     try {
//       const urlObj = new URL(url);
//       const pathParts = urlObj.pathname.split('/');
//       // videodelivery.net/{videoId}/watch 형식에서 videoId 추출
//       const videoId = pathParts.find(part => part !== '' && part !== 'watch');
      
//       console.log('Extracted videoId:', videoId);
//       return videoId || null;
//     } catch (e) {
//       console.error('Error parsing video URL:', e);
//       return null;
//     }
//   }

//   // useEffect(() => {
//   //   const timer = setTimeout(() => {
//   //     setIsVideoReady(true);
//   //   }, 3000);

//   //   return () => clearTimeout(timer);
//   // }, []);

//   const firstVideoId = getVideoId(post.videos?.[0]?.url);
//   const videoRef = useRef<HTMLVideoElement>(null);

//   if (!user) return null;

//   return (
//     <div 
//       className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
//       onClick={handleClose}
//     >
//       {/* preconnect 힌트 추가 */}
//       <link rel="preconnect" href="https://videodelivery.net" />
//       <link rel="preconnect" href="https://iframe.videodelivery.net" />
      
//       {/* src={`https://iframe.videodelivery.net/${firstVideoId}?autoplay=1&controls=0&fit=cover&preload=auto&startTime=0`} */}
//       <div 
//         className="bg-black rounded-lg overflow-hidden w-[85%] md:w-[30%]"
//         style={{
//           maxWidth: 'min(500px, 90vh * 2/3)'
//         }}
//         onClick={(e) => e.stopPropagation()}
//       >
//         <div className="relative aspect-[2/3] w-full">
//           <button 
//             onClick={handleClose}
//             className="absolute top-3 right-3 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white z-10"
//           >
//             <X className="w-6 h-6" />
//           </button>
          
//           <div 
//             className={`absolute inset-0 transition-opacity duration-500 ${
//               isVideoReady ? 'opacity-0 pointer-events-none' : 'opacity-100'
//             }`}
//           >
//             <Image
//               src={post.thumbnailUrl || '/post-placeholder.jpg'}
//               alt={post.content || ''}
//               fill
//               className="object-cover"
//             />
//           </div>

//           {(showPreview && firstVideoId) && (
//             <div 
//               className={`absolute inset-0 flex items-center justify-center pt-8 transition-opacity duration-500 ${
//                 isVideoReady ? 'opacity-100' : 'opacity-0'
//               }`}
//             >
//               <iframe
//                 src={`https://iframe.videodelivery.net/${firstVideoId}/watch?autoplay=1&controls=0&fit=cover&preload=auto&startTime=0&monitoring=false&customerMonitoring=false`}
//                 className="w-full h-full"
//                 style={{
//                   width: '100%',
//                   height: '100%',
//                 }}
//                 allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
//                 allowFullScreen
//                 onLoad={() => {
//                   // 로드 완료 시 상태 변경
//                   setIsVideoReady(true);
//                 }}
//               />
//             </div>
//           )}
        
        
//         </div>
  
//         {/* 정보 영역 - 썸네일 아래에 배치 */}
//         <div className="w-full bg-black p-4">
//           {/* 액션 버튼 */}
//           <div className="flex items-center mb-4">
//             {/* 좌측 버튼 그룹 */}
//             <div className="flex items-center gap-3">
//               {post.videos && post.videos.length > 0 && (
//                 <div className="w-12 aspect-square flex items-center justify-center hover:bg-white/10 border border-white rounded-full">
//                   <Play className="size-5 text-white" />
//                 </div>
//               )}
//               <div className="w-12 aspect-square flex items-center justify-center hover:bg-white/10 border border-white rounded-full">
//                 <BookmarkButton
//                   postId={post.id}
//                   initialState={{
//                     isBookmarkedByUser: post.bookmarks.some(
//                       (bookmark) => bookmark.userId === user.id,
//                     ),
//                   }}
//                 />
//               </div>
//               <div className="w-12 aspect-square flex items-center justify-center hover:bg-white/10 border border-white rounded-full">
//                 <LikeButton
//                   postId={post.id}
//                   initialState={{
//                     likes: post._count.likes,
//                     isLikedByUser: post.likes.some((like) => like.userId === user.id),
//                   }}
//                 />
//               </div>
//             </div>
  
//             {/* 우측 버튼 - 간격 추가 */}
//             <div className="ml-auto">
//               <Link 
//                 href={`/posts/${post.id}`}
//                 className="w-12 aspect-square flex items-center justify-center hover:bg-white/10 border border-white rounded-full"
//               >
//                 <ChevronDown className="w-8 h-8 text-white" />
//               </Link>
//             </div>
//           </div>

//           <div className="w-[98%] mx-auto border-t border-white/15 mb-5"></div>

//           {/* 컨텐츠 소개글 추가 */}
//           <div className="mb-4 text-white/90">
//             <p className="line-clamp-3 text-sm">
//               {post.content}
//             </p>
//           </div>

//           {/* 연령제한 및 컨텐츠 정보 */}
//           <div className="flex items-center gap-4 mb-4">
//             {/* <div className="flex items-center justify-center w-14 h-9 rounded-md border-2 font-bold text-base
//                           border-yellow-500 text-yellow-500">  */}
//             <div className="flex items-center justify-center w-14 h-9 rounded-md  border border-white font-bold text-sm
//                           text-white bg-blue-700"> 
//               {post.ageLimit} +
//             </div>
//             <span className="text-sm text-gray-300">
//               총 {post.videos?.length || 0}개의 컨텐츠
//             </span>
//           </div>
  
//           {/* 카테고리 표시 부분 */}
//           <div className="flex flex-wrap gap-2">
//             {post.categories?.map((category) => (
//               <span
//                 key={category}
//                 className="flex items-center px-3 py-2 rounded-sm bg-red-700 border border-red-700 text-gray-100 text-[10px]"
//               >
//                 {getCategoryName(category)}
//               </span>
//             ))}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }