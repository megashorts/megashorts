// /**
//  * 추천인 구조 관리 클라이언트 함수
//  */

// /**
//  * 추천인 구조 재구성 API 호출
//  * @param masterUserId 팀마스터 ID
//  * @param options 추가 옵션
//  * @param userInfo 사용자 정보
//  * @returns API 응답
//  */
// export async function rebuildReferralStructure(
//   masterUserId: string,
//   options: Record<string, any> = {},
//   masterUsername: string,
//   // userInfo?: { username: string}
// ): Promise<any> {
//   try {
//     const response = await fetch('/api/referral-structure/rebuild', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({
//         masterUserId,
//         options,
//         masterUsername,
//       })
//     });
    
//     if (!response.ok) {
//       const errorData = await response.json();
//       throw new Error(errorData.message || '추천인 구조 재구성 중 오류가 발생했습니다.');
//     }
    
//     return await response.json();
//   } catch (error) {
//     console.error('추천인 구조 재구성 API 호출 오류:', error);
//     throw error;
//   }
// }

// /**
//  * 추천인 구조 동기화 API 호출
//  * @param masterUserId 팀마스터 ID
//  * @param options 추가 옵션
//  * @param userInfo 사용자 정보
//  * @returns API 응답
//  */
// export async function syncReferralStructure(
//   masterUserId: string,
//   options: Record<string, any> = {},
//   masterUsername: string,
//   // userInfo?: { username: string}
// ): Promise<any> {
//   try {
//     const response = await fetch('/api/referral-structure/sync', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({
//         masterUserId,
//         options,
//         masterUsername
//       })
//     });
    
//     if (!response.ok) {
//       const errorData = await response.json();
//       throw new Error(errorData.message || '추천인 구조 동기화 중 오류가 발생했습니다.');
//     }
    
//     return await response.json();
//   } catch (error) {
//     console.error('추천인 구조 동기화 API 호출 오류:', error);
//     throw error;
//   }
// }

// /**
//  * 추천인 구조 검증 후 동기화 API 호출
//  * @param masterUserId 팀마스터 ID
//  * @param options 추가 옵션
//  * @param userInfo 사용자 정보
//  * @returns API 응답
//  */
// export async function validateAndSyncReferralStructure(
//   masterUserId: string,
//   options: Record<string, any> = {},
//   masterUsername: string,
//   // userInfo?: { username: string}
// ): Promise<any> {
//   try {
//     const response = await fetch('/api/referral-structure/sync', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({
//         masterUserId,
//         options: {
//           ...options,
//           validateAndSync: true
//         },
//         masterUsername
//       })
//     });
    
//     if (!response.ok) {
//       const errorData = await response.json();
//       throw new Error(errorData.message || '추천인 구조 검증 및 동기화 중 오류가 발생했습니다.');
//     }
    
//     return await response.json();
//   } catch (error) {
//     console.error('추천인 구조 검증 및 동기화 API 호출 오류:', error);
//     throw error;
//   }
// }
