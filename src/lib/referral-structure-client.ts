"use server";

/**
 * 추천인 구조 관리 클라이언트 함수
 */

/**
 * 추천인 구조 재구성 API 호출
 * @param masterUserId 팀마스터 ID
 * @returns API 응답
 */
// 추천인 구조 검증 및 필요시 리빌딩
// export async function rebuildReferralStructure(
//   masterUserId: string,
// ): Promise<any> {
//   try {

//     // 워커 URL 설정
//     const referralWorkerUrl = process.env.REFERRAL_STRUCTURE_WORKER_URL;
//     // const referralWorkerUrl = "http://localhost:8787";
//     console.log(`추천인 구조 워커 URL: ${referralWorkerUrl}`);
    
//     // API 키 확인
//     const apiKey = process.env.WORKER_API_KEY;
//     if (!apiKey) {
//       console.error('환경 변수 WORKER_API_KEY가 설정되지 않았습니다.');
//       throw new Error('환경 변수 WORKER_API_KEY가 설정되지 않았습니다.');
//     }

//     // 1. 추천인 구조 검증 요청
//     const verifyResponse = await fetch(`${referralWorkerUrl}/verify-referral-structure`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         'Authorization': `Bearer ${apiKey}`
//       },
//       body: JSON.stringify({
//         masterId: masterUserId,
//       })
//     });
    
//     if (!verifyResponse.ok) {
//       throw new Error(`추천인 구조 검증 요청 실패: ${verifyResponse.statusText}`);
//     }
    
//     const verifyResult = await verifyResponse.json();
    
//     // 2. 불일치가 있는 경우에만 리빌딩 요청
//     if (verifyResult.data.needsRebuild) {
//       console.log(`팀마스터 ${verifyResult.data.masterUsername}의 추천인 구조에 불일치가 발견되어 리빌딩을 수행합니다.`);
      
//       const rebuildResponse = await fetch(`${referralWorkerUrl}/rebuild-referral-structure`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${apiKey}`
//         },
//         body: JSON.stringify({
//           masterId: masterUserId,
//         })
//       });
      
//       if (!rebuildResponse.ok) {
//         throw new Error(`추천인 구조 리빌딩 요청 실패: ${rebuildResponse.statusText}`);
//       }
//     } else {
//       console.log(`팀마스터 ${verifyResult.data.masterUsername}의 추천인 구조가 최신 상태입니다.`);
//     }
    
//     return true;
//   } catch (error) {
//     console.error(`추천인 구조 검증 및 리빌딩 오류:`, error);
//     return false;
//   }
// }

/**
 * 추천인 구조 동기화 API 호출
 * @param masterUserId 팀마스터 ID
 * @param options 추가 옵션
 * @param userInfo 사용자 정보
 * @returns API 응답
 */
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

// 포인트 지급 전 추천인 구조 검증 및 필요시 리빌딩
// async function syncReferralStructure(masterUserId: string) {
export async function syncReferralStructure(
  userId: string,
  action: string,
  masterUserId: string,
  // userInfo?: { username: string}
): Promise<any> {
  try {

    // 워커 URL 설정
    const referralWorkerUrl = process.env.REFERRAL_STRUCTURE_WORKER_URL;
    // const referralWorkerUrl = "http://localhost:8787";
    console.log(`추천인 구조 워커 URL: ${referralWorkerUrl}`);
    
    // API 키 확인
    const apiKey = process.env.WORKER_API_KEY;
    if (!apiKey) {
      console.error('환경 변수 WORKER_API_KEY가 설정되지 않았습니다.');
      throw new Error('환경 변수 WORKER_API_KEY가 설정되지 않았습니다.');
    }

    // 1. 추천인 구조 검증 요청
    const response = await fetch(`${referralWorkerUrl}/sync-user-referral-structure`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        userId,
        action,
        masterId: masterUserId,
      })
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.log(`사용자 ${userId}의 영업팀 삭제 요청 실패.`);
      throw new Error(`영업팀 삭제 요청 실패: ${response.statusText}`);
    }
    
    // 2. 불일치가 있는 경우에만 리빌딩 요청
    // if (verifyResult.data.needsRebuild) {
    //   console.log(`팀마스터 ${verifyResult.data.masterUsername}의 추천인 구조에 불일치가 발견되어 리빌딩을 수행합니다.`);
      
    //   const response = await fetch(`${referralWorkerUrl}/rebuild-referral-structure`, {
    //     method: 'POST',
    //     headers: {
    //       'Content-Type': 'application/json',
    //       'Authorization': `Bearer ${apiKey}`
    //     },
    //     body: JSON.stringify({
    //       masterUserId,
    //     })
    //   });
      
    //   if (!response.ok) {
    //     throw new Error(`추천인 구조 리빌딩 요청 실패: ${response.statusText}`);
    //   }
    // } else {
    //   console.log(`팀마스터 ${result.data.masterUsername}의 추천인 구조가 최신 상태입니다.`);
    // }
    
    return true;
  } catch (error) {
    console.error(`추천인 구조 검증 및 리빌딩 오류:`, error);
    return false;
  }
}

/**
 * 추천인 구조 검증 후 동기화 API 호출
 * @param masterUserId 팀마스터 ID
 * @param options 추가 옵션
 * @param userInfo 사용자 정보
 * @returns API 응답
 */
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
