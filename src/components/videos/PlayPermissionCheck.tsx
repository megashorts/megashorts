'use client';

import { useEffect, useRef } from 'react';
import { useSession } from '@/components/SessionProvider';
import { useUserAuth } from '@/hooks/queries/useUserAuth';

interface PlayPermissionCheckProps {
  postId: string;
  videoId: string;
  playOrder: number;
  ageLimit: number;
  isPremium: boolean;
  uploaderId: string;
  setIsActive: (active: boolean) => void;
  onPermissionCheck: (code: number) => void;
}

export default function PlayPermissionCheck({ 
  postId, 
  videoId,
  playOrder,
  ageLimit,
  isPremium,
  uploaderId,
  setIsActive,
  onPermissionCheck 
}: PlayPermissionCheckProps) {
  const { user } = useSession();
  const { data: userAuth, isLoading } = useUserAuth(user?.id);
  const isChecked = useRef<string>('');
  const isProcessing = useRef(false);

  useEffect(() => {
    const checkPermission = async () => {
      // 이미 체크했거나 처리 중이면 스킵
      if (isChecked.current === videoId || isProcessing.current) {
        return;
      }

      // API 응답 대기
      if (isLoading) {
        return;
      }

      isProcessing.current = true;

      try {
        // 1. 성인 컨텐츠 체크
        if (ageLimit >= 18) {
          if (!user) {
            setIsActive(false);
            onPermissionCheck(1);  // 로그인 필요
            isChecked.current = videoId;
            return;
          }

          if (!userAuth?.adultauth) {
            setIsActive(false);
            onPermissionCheck(2);  // 성인인증 필요
            isChecked.current = videoId;
            return;
          }
        }

        // 2. 유료 컨텐츠 체크
        if (isPremium) {
          if (!user) {
            setIsActive(false);
            onPermissionCheck(1);  // 로그인 필요
            isChecked.current = videoId;
            return;
          }

          const isSubscribed = userAuth?.subscriptionEndDate && 
            new Date(userAuth.subscriptionEndDate) >= new Date();
          
          if (isSubscribed) {
            isChecked.current = videoId;
            return;
          }

          // 코인 결제 처리
          console.log('Sending coin payment request:', { videoId, postId, uploaderId });

          const payResponse = await fetch('/api/user/coinpay', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ videoId, postId, uploaderId })
          });

          console.log('Coin payment response status:', payResponse.status);

          const responseText = await payResponse.text();
          console.log('Raw response:', responseText);

          if (!payResponse.ok) {
            throw new Error('Failed to process coin payment');
          }

          let result;
          try {
            result = JSON.parse(responseText);
            console.log('Parsed response:', result);
          } catch (e) {
            console.error('Failed to parse response:', e);
            throw new Error('Invalid response format');
          }

          if (result.alreadyPurchased) {
            console.log('Already purchased this video');
            isChecked.current = videoId;
            return;
          }

          if (!result.success) {
            console.log('Payment failed:', result.error);
            setIsActive(false);
            onPermissionCheck(3);  // 구독/코인 필요
            isChecked.current = videoId;
            return;
          }

          console.log('Payment successful:', {
            remainingCoins: result.remainingCoins
          });

          isChecked.current = videoId;
        }

        isChecked.current = videoId;
      } catch (error) {
        console.error('Permission check error:', error);
        setIsActive(false);
        onPermissionCheck(4);  // 에러 발생
        isChecked.current = videoId;
      } finally {
        isProcessing.current = false;
      }
    };

    checkPermission();
  }, [postId, videoId, playOrder, ageLimit, isPremium, user, userAuth, isLoading, setIsActive, onPermissionCheck]);

  return null;
}

// 'use client';

// import { useEffect, useState } from 'react';
// import { useSession } from '@/components/SessionProvider';
// import { useRouter } from 'next/navigation';

// const globalCheckState = {
//   checked: false
// };

// interface PlayPermissionCheckProps {
//   postId: string;
//   videoId: string;
//   playOrder: number;
//   setIsActive: (active: boolean) => void;
// }

// interface PermissionModalState {
//   isOpen: boolean;
//   message: string;
//   imageUrl: string;
//   redirectUrl?: string;
//   buttonText?: string;
// }

// export default function PlayPermissionCheck({ 
//   postId, 
//   videoId, 
//   playOrder,
//   setIsActive 
// }: PlayPermissionCheckProps) {
//   const { user } = useSession();
//   const router = useRouter();
//   const [permissionModal, setPermissionModal] = useState<PermissionModalState>({
//     isOpen: false,
//     message: '',
//     imageUrl: '',
//   });

//   useEffect(() => {
//     if (!globalCheckState.checked) {
//       console.log('Permission Check Called:', { 
//         postId, 
//         videoId, 
//         playOrder,
//         isLoggedIn: !!user,
//       });
      
//       // 로그인 체크
//       if (!user) {
//         console.log('User not logged in, showing modal');
//         setIsActive(false);
//         setPermissionModal({
//           isOpen: true,
//           message: '로그인이 필요한 컨텐츠입니다.',
//           imageUrl: '/MS Logo emblem.svg',
//           redirectUrl: '/login',
//           buttonText: '로그인 이동'
//         });
//       }
//       // 성인인증 체크 예시
//       // else if (!user.adultauth) {
//       //   setIsActive(false);
//       //   setPermissionModal({
//       //     isOpen: true,
//       //     message: '성인인증이 필요한 컨텐츠입니다.',
//       //     imageUrl: '/MS Logo emblem.svg',
//       //     redirectUrl: `/usermenu/users/${user.username}`,
//       //     buttonText: '성인인증 이동'
//       //   });
//       // }
//       // // 구독 체크 예시
//       // else if (!user.subscriptionEndDate) {
//       //   setIsActive(false);
//       //   setPermissionModal({
//       //     isOpen: true,
//       //     message: '구독이 필요한 컨텐츠입니다.',
//       //     imageUrl: '/MS Logo emblem.svg',
//       //     redirectUrl: '/subscription',
//       //     buttonText: '구독하기'
//       //   });
//       // }
      
//       globalCheckState.checked = true;
//     }

//     return () => {
//       if (!document.querySelector('[data-permission-check]')) {
//         globalCheckState.checked = false;
//       }
//     };
//   }, [postId, videoId, playOrder, user, setIsActive]);

//   if (!permissionModal.isOpen) return null;

//   return (
//     <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
//       <div className="bg-black rounded-lg shadow-xl w-[90vw] max-w-[300px] border p-8">
//         <div className="flex flex-col items-center gap-8">
//           <img
//             src={permissionModal.imageUrl}
//             alt="megashorts emblem"
//             width={100}
//             height={100}
//             className="object-cover"
//           />
//           <p className="text-center text-base font-medium text-muted-foreground whitespace-pre-line">
//             {permissionModal.message}
//           </p>
//           {permissionModal.redirectUrl && (
//             <button
//               onClick={() => {
//                 router.push(permissionModal.redirectUrl!);
//                 setPermissionModal(prev => ({ ...prev, isOpen: false }));
//               }}
//               className="w-full px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
//             >
//               {permissionModal.buttonText}
//             </button>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }