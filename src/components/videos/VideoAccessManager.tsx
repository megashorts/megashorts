// 'use client';

// import { useEffect, useState } from 'react';
// import { useSession } from '@/components/SessionProvider';
// import { useSubscription } from '@/hooks/useSubscription';
// import { toast } from '@/components/ui/use-toast';
// import kyInstance from '@/lib/ky';

// import { checkVideoAccess } from '@/lib/videoAccess';

// interface VideoAccessManagerProps {
//   videoId: string;
//   postId: string;
//   isPremium: boolean;
//   ageLimit?: number;
//   children: React.ReactNode;
// }

// export default function VideoAccessManager({
//   videoId,
//   isPremium,
//   ageLimit,
//   children
// }: VideoAccessManagerProps) {
//   const { user } = useSession() as { user: AuthUser | null };
//   const [canWatch, setCanWatch] = useState(false);
//   const [isLoading, setIsLoading] = useState(true);
//   const { data: subscriptionData } = useSubscription();

//   useEffect(() => {
//     async function checkAccess() {
//       const videoInfo: VideoPlayInfo = {
//         id: videoId,
//         url: '',
//         filename: '',
//         sequence: 0,
//         isPremium,
//         language: 'KOREAN',
//         ageLimit,
//         Subtitle: []
//       };

//       const accessData = user ? {
//         subscription: subscriptionData?.subscription || null,
//         subscriptionEndDate: user.subscriptionEndDate ? new Date(user.subscriptionEndDate) : null,
//         adultauth: user.adultauth || false,
//         mscoin: user.mscoin || 0
//       } : undefined;

//       const accessResult = checkVideoAccess(videoInfo, accessData);

//       if (accessResult.canWatch) {
//         setCanWatch(true);
//         setIsLoading(false);
//         return;
//       }

//       try {
//         if (user) {
//           const { hasPurchased } = await kyInstance
//             .get(`/api/videos/access/${videoId}`)
//             .json<{ hasPurchased: boolean }>();

//           if (hasPurchased) {
//             setCanWatch(true);
//             setIsLoading(false);
//             return;
//           }

//           if (accessResult.requiredAction === 'coin' && accessResult.coinRequired) {
//             try {
//               await kyInstance.post(`/api/videos/purchase/${videoId}`);
//               toast({
//                 description: `${accessResult.coinRequired}코인이 차감되었습니다.`,
//               });
//               setCanWatch(true);
//             } catch (purchaseError) {
//               console.error('Purchase failed:', purchaseError);
//               toast({
//                 variant: "destructive",
//                 description: "구매에 실패했습니다.",
//               });
//               setCanWatch(false);
//             }
//           } else {
//             setCanWatch(false);
//             if (accessResult.reason) {
//               toast({
//                 description: accessResult.reason,
//               });
//             }
//           }
//         } else {
//           setCanWatch(false);
//         }
//       } catch (error) {
//         console.error('Access check failed:', error);
//         toast({
//           variant: "destructive",
//           description: "접근 권한 확인 중 오류가 발생했습니다.",
//         });
//         setCanWatch(false);
//       }
      
//       setIsLoading(false);
//     }

//     checkAccess();
//   }, [videoId, isPremium, ageLimit, user, subscriptionData]);

//   if (isLoading) {
//     return <div className="flex items-center justify-center h-full">
//       <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
//     </div>;
//   }

//   if (!canWatch) {
//     return (
//       <div className="flex flex-col items-center justify-center h-full p-4">
//         <h2 className="text-xl font-bold mb-4">
//           {user ? "시청 권한이 필요합니다." : "로그인이 필요합니다."}
//         </h2>
//         {user && (
//           <p className="text-sm text-gray-500 text-center">
//             {isPremium ? "구독하거나 코인을 사용하여 시청할 수 있습니다." : "시청 권한이 없습니다."}
//           </p>
//         )}
//       </div>
//     );
//   }

//   return children;
// }
