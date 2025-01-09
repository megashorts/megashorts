// import { AccessMethod, Language } from '@prisma/client';
// import { VideoPlayInfo } from './types';

// interface UserAccessData {
//   subscription?: string | null;
//   subscriptionEndDate?: Date | null;
//   adultauth?: boolean;
//   mscoin?: number;
// }

// export interface VideoAccessResult {
//   canWatch: boolean;
//   reason?: string;
//   requiredAction?: 'subscribe' | 'adultauth' | 'coin';
//   coinRequired?: number;
// }

// export function checkVideoAccess(
//   video: VideoPlayInfo,
//   userData?: UserAccessData
// ): VideoAccessResult {
//   // 무료 동영상
//   if (!video.isPremium) {
//     return { canWatch: true };
//   }

//   // 로그인하지 않은 경우
//   if (!userData) {
//     return {
//       canWatch: false,
//       reason: '로그인이 필요합니다.',
//       requiredAction: 'subscribe'
//     };
//   }

//   // 구독 확인
//   const now = new Date();
//   const subscriptionValid = userData.subscription && 
//     userData.subscriptionEndDate && 
//     new Date(userData.subscriptionEndDate) > now;

//   if (subscriptionValid) {
//     return { canWatch: true };
//   }

//   // 성인 인증 필요한 경우
// //   if (video.ageLimit? >= 19 && !userData.adultauth) {
// //     return {
// //       canWatch: false,
// //       reason: '성인인증이 필요합니.',
// //       requiredAction: 'adultauth'
// //     };
// //   }

//   // 코인으로 구매 가능 여부
//   const requiredCoins = 2; 
//   if (!userData.mscoin || userData.mscoin < requiredCoins) {
//     return {
//       canWatch: false,
//       reason: '코인이 부족합니다.',
//       requiredAction: 'coin',
//       coinRequired: requiredCoins
//     };
//   }

//   return {
//     canWatch: false,
//     reason: '구독이 필요하거나 코인으로 구매할 수 있습니다.',
//     requiredAction: 'subscribe',
//     coinRequired: requiredCoins
//   };
// }
