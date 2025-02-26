// 'use client';

// import { useEffect, useState } from 'react';
// import { Language, User } from '@prisma/client';
// import VideoPlayer from './VideoPlayer';
// import { AlertModal } from '@/components/ui/AlertModal';

// interface VideoPermissionCheckProps {
//   post: {
//     id: string;
//     ageLimit: number;
//   } | null;
//   currentVideo: {
//     id: string;
//     url: string;
//     isPremium: boolean;
//     sequence: number;
//     subtitle: Language[];
//   } | null;
//   user: User | null;
//   onTimeUpdate?: (currentTime: number) => void;
//   onEnded?: () => void;
//   showControls?: boolean;
//   className?: string;
//   // onPermissionDenied: () => void;
// }

// interface ModalState {
//   isOpen: boolean;
//   message: string;
//   imageUrl: string;
//   redirectUrl?: string;
//   buttonText?: string;
// }

// export function VideoPermissionCheck({
//   post,
//   currentVideo,
//   user,
//   onTimeUpdate,
//   onEnded,
//   showControls,
//   className
// }: VideoPermissionCheckProps) {
//   const [hasPermission, setHasPermission] = useState(true);
//   const [modalState, setModalState] = useState<ModalState>({
//     isOpen: false,
//     message: '',
//     imageUrl: '',
//   });

//   useEffect(() => {
//     let mounted = true;

//     const checkPermission = async () => {
//       if (!post || !currentVideo) return;

//       // 1. 성인 컨텐츠 체크
//       if (post.ageLimit >= 18) {
//         if (!user) {
//           if (mounted) {
//             setHasPermission(false);
//             setModalState({
//               isOpen: true,
//               message: '연령제한 컨텐츠로 \n로그인이 필요합니다',
//               imageUrl: '/MS Logo emblem.svg',
//               redirectUrl: '/login',
//               buttonText: '로그인 이동'
//             });
//           }
//           return;
//         }
        
//         if (!user.adultauth) {
//           if (mounted) {
//             setHasPermission(false);
//             setModalState({
//               isOpen: true,
//               message: '연령제한 컨텐츠로 \n성인인증이 필요합니다.',
//               imageUrl: '/MS Logo emblem.svg',
//               redirectUrl: `/usermenu/users/${user.username}`,
//               buttonText: '성인인증 이동'
//             });
//           }
//           return;
//         }
//       }

//       // 2. 유료 컨텐츠 체크
//       if (currentVideo.isPremium) {
//         const isSubscribed = user?.subscriptionEndDate && new Date(user.subscriptionEndDate) >= new Date();
        
//         if (isSubscribed) {
//           if (mounted) setHasPermission(true);
//           return;
//         }

//         if (!user) {
//           if (mounted) {
//             setHasPermission(false);
//             setModalState({
//               isOpen: true,
//               message: '로그인이 필요한 컨텐츠입니다.',
//               imageUrl: '/MS Logo emblem.svg',
//               redirectUrl: '/login',
//               buttonText: '로그인 이동'
//             });
//           }
//           return;
//         }

//         try {
//           const watchedResponse = await fetch(`/api/videos/check-watched?videoId=${currentVideo.id}`);
//           if (!watchedResponse.ok) {
//             throw new Error('Failed to check watch history');
//           }
//           const { hasWatched } = await watchedResponse.json();
          
//           if (hasWatched) {
//             if (mounted) setHasPermission(true);
//             return;
//           }

//           if (user.mscoin < 2) {
//             if (mounted) {
//               setHasPermission(false);
//               setModalState({
//                 isOpen: true,
//                 message: '프리미엄 컨텐츠입니다.\n구독 또는 코인으로 이용하세요',
//                 imageUrl: '/MS Logo emblem.svg',
//                 redirectUrl: `/subscription`,
//                 buttonText: '이용하러 가기'
//               });
//             }
//             return;
//           }

//           const coinResponse = await fetch('/api/user/coinpay', {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({ 
//               videoId: currentVideo.id,
//             })
//           });

//           if (!coinResponse.ok) {
//             throw new Error('Failed to process coin payment');
//           }
          
//           if (mounted) setHasPermission(true);
//         } catch (error) {
//           if (mounted) {
//             setHasPermission(false);
//             setModalState({
//               isOpen: true,
//               message: '오류가 발생했습니다.',
//               imageUrl: '/MS Logo emblem.svg',
//             });
//           }
//           return;
//         }
//       } else {
//         // 무료 컨텐츠는 항상 허용
//         if (mounted) setHasPermission(true);
//       }
//     };

//     checkPermission();

//     return () => {
//       mounted = false;
//     };
//   }, [post, currentVideo, user]);

//   return (
//     <>
//       {hasPermission && currentVideo && (
//         <VideoPlayer
//           videoId={currentVideo.id}
//           url={currentVideo.url}
//           showControls={showControls}
//           onEnded={onEnded}
//           onTimeUpdate={onTimeUpdate}
//           className={className}
//           isPlaying={hasPermission}
//         />
//       )}

//       <AlertModal
//         isOpen={modalState.isOpen}
//         onClose={() => setModalState(prev => ({ ...prev, isOpen: false }))}
//         message={modalState.message}
//         imageUrl={modalState.imageUrl}
//         redirectUrl={modalState.redirectUrl}
//         buttonText={modalState.buttonText}
//       />
//     </>
//   );
// }
