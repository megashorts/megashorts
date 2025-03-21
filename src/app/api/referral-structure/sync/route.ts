import { NextRequest, NextResponse } from 'next/server';
import { validateRequest } from '@/auth';
import { USER_ROLE } from '@/lib/constants';
import { callReferralStructureWorker } from '../utils';
import prisma from '@/lib/prisma';

/**
 * 추천인 구조 동기화 API 라우트
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
    
    // 필수 파라미터 확인
    const { masterUserId, options } = body;
    
    if (!masterUserId) {
      return NextResponse.json(
        { success: false, message: '필수 파라미터 누락: masterUserId' },
        { status: 400 }
      );
    }
    
    // 사용자 정보 조회
    const userInfo = await prisma.user.findUnique({
      where: { id: masterUserId },
      select: { 
        username: true, 
        displayName: true,
        email: true
      }
    });
    
    if (!userInfo) {
      return NextResponse.json(
        { 
          success: false, 
          message: `사용자 정보를 찾을 수 없음: ${masterUserId}` 
        },
        { status: 404 }
      );
    }
    
    console.log(`[SYNC ROUTE] 사용자 정보 조회 성공:`, userInfo);
    
    // 검증 후 동기화 옵션 확인
    const validateAndSync = options?.validateAndSync === true;
    
    // 변경된 회원 목록 조회
    const { fetchChangedMembers } = await import('../utils');
    const changes = await fetchChangedMembers(masterUserId, options?.fromDate);
    
    // 워커 호출 (사용자 정보와 변경된 회원 목록 포함)
    const result = await callReferralStructureWorker('/sync', {
      masterUserId,
      userInfo,
      options: {
        ...(options || {}),
        validateAndSync,
        members: changes // 변경된 회원 목록 전달
      }
    });
    
      // 검증 결과가 있고 유효하지 않은 경우
      if (validateAndSync && result.validationResult && !result.validationResult.valid) {
        // 문제 내용을 상세히 포함
        const issuesDetails = result.validationResult.issues?.map((issue: { 
          type: 'missing_member' | 'invalid_relation' | 'orphaned_member' | 'cycle_detected' | 'other';
          description: string;
          affectedIds?: string[];
        }) => issue.description).join(', ');
        
        // 문제 유형에 따른 설명 생성
        const problemExplanation = result.validationResult.issues?.some((issue: { 
          type: 'missing_member' | 'invalid_relation' | 'orphaned_member' | 'cycle_detected' | 'other';
          description: string;
          affectedIds?: string[];
        }) => 
          issue.description.includes('추천인 구조 파일이 존재하지 않음')
        ) 
          ? '파일이 존재하지 않는 문제입니다. 먼저 rebuild를 실행하세요.'
          : '구조에 문제가 있습니다. 이 문제를 해결해야 동기화를 진행할 수 있습니다.';
        
        return NextResponse.json({
          success: true,
          result: {
            ...result,
            requiresConfirmation: false, // 확인 버튼 비활성화
            cannotSync: true, // 동기화 불가능 플래그 추가
            message: `추천인 구조 검증 실패: ${result.validationResult.issues?.length || 0}개의 문제가 발견되었습니다.`,
            issuesDetails: issuesDetails,
            problemExplanation: problemExplanation,
            errorMessage: `추천인 구조에 ${result.validationResult.issues?.length || 0}개의 문제가 발견되었습니다: ${issuesDetails}. ${problemExplanation}`
          },
          timestamp: new Date().toISOString()
        });
      }
    
    // 결과 반환
    return NextResponse.json({
      success: true,
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('추천인 구조 동기화 API 오류:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: `추천인 구조 동기화 API 오류: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

/**
 * 변경된 회원 목록 조회 API
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
    const action = url.searchParams.get('action');
    const fromDate = url.searchParams.get('fromDate');
    
    if (!masterUserId) {
      return NextResponse.json(
        { success: false, message: '필수 파라미터 누락: masterUserId' },
        { status: 400 }
      );
    }
    
    if (action === 'fetch_changed_members') {
      try {
        // 기준 날짜 설정
        const startDate = fromDate ? new Date(fromDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 기본값: 7일 전
        
        // 변경된 회원 목록을 직접 조회
        const { fetchChangedMembers } = await import('../utils');
        const changes = await fetchChangedMembers(masterUserId, fromDate ? fromDate : undefined);
        
        return NextResponse.json({
          success: true,
          changes,
          timestamp: new Date().toISOString()
        });
      } catch (dbError) {
        console.error('변경된 회원 목록 조회 오류:', dbError);
        return NextResponse.json(
          {
            success: false,
            message: `변경된 회원 목록 조회 오류: ${dbError instanceof Error ? dbError.message : String(dbError)}`,
            timestamp: new Date().toISOString()
          },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json(
      { success: false, message: '지원되지 않는 작업 유형입니다.' },
      { status: 400 }
    );
  } catch (error) {
    console.error('추천인 구조 동기화 데이터 제공 API 오류:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: `추천인 구조 동기화 데이터 제공 API 오류: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
