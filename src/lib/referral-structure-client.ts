"use server";

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
    
    return true;
  } catch (error) {
    console.error(`추천인 구조 검증 및 리빌딩 오류:`, error);
    return false;
  }
}