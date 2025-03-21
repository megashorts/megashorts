import { NextRequest, NextResponse } from 'next/server';
import { validateRequest } from '@/auth';
import { USER_ROLE } from '@/lib/constants';
import { callReferralStructureWorker } from './utils';

/**
 * 회원 가입 시 추천인 구조 업데이트
 * @param userId 회원 ID
 * @param username 회원 이름
 * @param referrerId 추천인 ID (선택 사항)
 * @param teamMasterId 팀마스터 ID
 */
async function updateReferralStructureOnSignup(
  userId: string,
  username: string,
  teamMasterId: string,
  referrerId?: string,
  displayName?: string,
  email?: string
): Promise<any> {
  // 회원 정보 구성
  const data = {
    masterUserId: teamMasterId,
    options: {
      signupEvent: {
        userId,
        username,
        displayName,
        email,
        referrerId
      }
    }
  };
  
  // 워커 호출 (싱크 엔드포인트 사용)
  return await callReferralStructureWorker('/sync', data);
}

/**
 * 회원 탈퇴 시 추천인 구조 업데이트
 * @param userId 회원 ID
 * @param teamMasterId 팀마스터 ID
 */
async function updateReferralStructureOnDeleteMember(
  userId: string,
  teamMasterId: string
): Promise<any> {
  // 회원 삭제 정보 구성
  const data = {
    masterUserId: teamMasterId,
    options: {
      deleteMemberEvent: {
        userId
      }
    }
  };
  
  // 워커 호출 (싱크 엔드포인트 사용)
  return await callReferralStructureWorker('/sync', data);
}

/**
 * 팀마스터 설정 변경 시 추천인 구조 업데이트
 * @param masterUserId 팀마스터 ID
 * @param settings 팀마스터 설정
 * @param userInfo 사용자 정보
 */
async function updateReferralStructureOnSettingsChange(
  masterUserId: string,
  settings: any,
  userInfo?: { username: string; displayName?: string; email?: string }
): Promise<any> {
  // 설정 변경 정보 구성
  const data = {
    masterUserId,
    settings,
    userInfo
  };
  
  // 워커 호출
  return await callReferralStructureWorker('/event/settings-update', data);
}

/**
 * API 라우트 핸들러
 */
export async function POST(request: NextRequest) {
  try {
    // 사용자 인증
    const { user } = await validateRequest();
    
    if (!user || user.userRole < USER_ROLE.TEAM_MASTER) {
      return NextResponse.json(
        { success: false, message: '인증 실패: 권한이 없습니다.' },
        { status: 401 }
      );
    }
    
    // 요청 본문 파싱
    const body = await request.json();
    
    // 작업 유형 확인
    const { action } = body;
    
    if (!action) {
      return NextResponse.json(
        { success: false, message: '작업 유형이 지정되지 않았습니다.' },
        { status: 400 }
      );
    }
    
    let result;
    
    // 작업 유형에 따라 처리
    switch (action) {
      case 'signup':
        // 회원 가입 처리
        const { userId, username, referrerId, teamMasterId, displayName, email } = body;
        
        if (!userId || !username || !teamMasterId) {
          return NextResponse.json(
            { success: false, message: '필수 파라미터가 누락되었습니다.' },
            { status: 400 }
          );
        }
        
        result = await updateReferralStructureOnSignup(
          userId,
          username,
          teamMasterId,
          referrerId,
          displayName,
          email
        );
        break;
        
      case 'delete_member':
        // 회원 삭제 처리
        const { userId: deleteUserId, teamMasterId: deleteTeamMasterId } = body;
        
        if (!deleteUserId || !deleteTeamMasterId) {
          return NextResponse.json(
            { success: false, message: '필수 파라미터가 누락되었습니다.' },
            { status: 400 }
          );
        }
        
        result = await updateReferralStructureOnDeleteMember(deleteUserId, deleteTeamMasterId);
        break;
        
      case 'update_settings':
        // 설정 변경 처리
        const { masterUserId, settings, userInfo } = body;
        
        if (!masterUserId || !settings) {
          return NextResponse.json(
            { success: false, message: '필수 파라미터가 누락되었습니다.' },
            { status: 400 }
          );
        }
        
        result = await updateReferralStructureOnSettingsChange(masterUserId, settings, userInfo);
        break;
        
      default:
        return NextResponse.json(
          { success: false, message: '지원되지 않는 작업 유형입니다.' },
          { status: 400 }
        );
    }
    
    // 결과 반환
    return NextResponse.json({
      success: true,
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('추천인 구조 API 오류:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: `추천인 구조 API 오류: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

/**
 * 추천인 구조 조회
 */
export async function GET(request: NextRequest) {
  try {
    // 사용자 인증
    const { user } = await validateRequest();
    
    if (!user || user.userRole < USER_ROLE.TEAM_MASTER) {
      return NextResponse.json(
        { success: false, message: '인증 실패: 권한이 없습니다.' },
        { status: 401 }
      );
    }
    
    // URL 파라미터 파싱
    const url = new URL(request.url);
    const masterUserId = url.searchParams.get('masterUserId');
    const shardIndex = url.searchParams.get('shardIndex');
    
    if (!masterUserId) {
      return NextResponse.json(
        { success: false, message: '팀마스터 ID가 지정되지 않았습니다.' },
        { status: 400 }
      );
    }
    
    // 워커 호출
    const result = await callReferralStructureWorker('/get', {
      masterUserId,
      shardIndex: shardIndex || undefined
    }, 'GET');
    
    // 결과 반환
    return NextResponse.json({
      success: true,
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('추천인 구조 조회 API 오류:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: `추천인 구조 조회 API 오류: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
