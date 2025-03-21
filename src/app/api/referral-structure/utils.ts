import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';

// 워커 URL 및 API 키 설정
export const WORKER_URL = 'https://referral-structure.msdevcm.workers.dev';
export const API_KEY = process.env.WORKER_API_KEY;

if (!API_KEY) {
  console.error('환경 변수 WORKER_API_KEY가 설정되지 않았습니다.');
}

// 워커 URL 로깅 (디버깅용)
console.log('추천인 구조 워커 URL:', WORKER_URL);

// 타입 정의
export interface MemberInfo {
  userId: string;
  username: string;
  displayName?: string;
  email?: string;
  level?: number;
  subLevel?: number;
  userRole?: number;
  referrerId?: string;
  joinedAt?: string;
  status?: 'active' | 'inactive' | 'deleted';
  metadata?: Record<string, any>;
}

export interface MasterSettings {
  masterType: string;
  settings?: Record<string, any>;
}

/**
 * 추천인 구조 워커 호출 함수
 * 
 * @param endpoint 워커 엔드포인트
 * @param data 작업 데이터
 * @returns 워커 응답
 */
export async function callReferralStructureWorker(
  endpoint: string,
  data: any,
  method: 'GET' | 'POST' = 'POST'
): Promise<any> {
  try {
    // API 키 확인
    if (!API_KEY) {
      throw new Error('환경 변수 WORKER_API_KEY가 설정되지 않았습니다.');
    }
    
    // 요청 헤더
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
      'Accept': 'application/json'
    };
    
    console.log(`[UTILS] 워커 호출: ${WORKER_URL}${endpoint}`, data);
    
    let url = `${WORKER_URL}${endpoint}`;
    
    // GET 요청인 경우 쿼리 파라미터 추가
    if (method === 'GET' && data) {
      const queryParams = new URLSearchParams();
      
      for (const [key, value] of Object.entries(data)) {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      }
      
      url = `${url}?${queryParams.toString()}`;
    }
    
    // 워커 호출
    const response = await fetch(url, {
      method,
      headers,
      ...(method === 'POST' ? { body: JSON.stringify(data) } : {})
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`워커 오류 응답 (${endpoint}): ${response.status} - ${errorText}`);
      
      // 응답 본문에서 오류 메시지 추출 시도
      let detailedError = `워커 오류 응답: ${response.status}`;
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.message) {
          detailedError = `워커 오류 응답: ${errorJson.message}`;
        } else if (errorJson.error) {
          detailedError = `워커 오류 응답: ${errorJson.error}`;
        } else {
          detailedError = `워커 오류 응답: ${response.status} - ${errorText}`;
        }
      } catch (e) {
        // JSON 파싱 실패 시 원본 텍스트 사용
        if (errorText && errorText.length > 0) {
          detailedError = `워커 오류 응답: ${response.status} - ${errorText}`;
        }
      }
      
      throw new Error(detailedError);
    }
    
    const result = await response.json();
    console.log(`[UTILS] 워커 응답 결과:`, result);
    return result;
  } catch (error) {
    console.error(`워커 호출 오류 (${endpoint}):`, error);
    throw error;
  }
}

/**
 * API 키 검증 함수
 */
export function validateApiKey(request: NextRequest): boolean {
  // 요청 헤더에서 API 키 가져오기
  const authHeader = request.headers.get('Authorization');
  const apiKey = authHeader ? authHeader.replace('Bearer ', '') : null;
  
  // 환경 변수에서 API 키 가져오기
  const validApiKey = process.env.WORKER_API_KEY;
  
  // API 키 검증
  return apiKey === validApiKey && !!validApiKey;
}

/**
 * 팀마스터에 속한 회원 목록 조회
 */
export async function fetchTeamMembers(
  masterUserId: string,
  includeInactive: boolean = false,
  page: number = 1,
  pageSize: number = 100
) {
  try {
    // 시스템 설정에서 업로더 레벨 정보 가져오기
    const uploaderLevelSetting = await prisma.systemSetting.findUnique({
      where: {
        key: 'uploaderQualification'
      }
    });
    
    // 팀마스터에 속한 회원 조회 (teamMaster 필드 사용)
    const members = await prisma.user.findMany({
      where: {
        teamMaster: masterUserId,
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        email: true,
        referredBy: true,
        createdAt: true,
        userRole: true
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // 전체 회원 수 조회
    const totalCount = await prisma.user.count({
      where: {
        teamMaster: masterUserId,
      }
    });
    
    // 업로더 레벨 정보 파싱
    let uploaderLevels: Array<{level: number, minViews: number, shareRatio: number}> = [];
    if (uploaderLevelSetting && uploaderLevelSetting.value) {
      const settingValue = uploaderLevelSetting.value as any;
      if (settingValue.value && Array.isArray(settingValue.value)) {
        uploaderLevels = settingValue.value;
      }
    }
    
    // 회원 정보 변환
    const memberInfos: MemberInfo[] = members.map(member => {
      // 기본 레벨 설정 (레벨 0 - 자격 없음)
      let level = 0;
      let subLevel = 0;
      
      // 회원 상태 결정 (현재 스키마에는 status 필드가 없으므로 모두 active로 설정)
      const status = 'active' as 'active' | 'inactive' | 'deleted';
      
      return {
        userId: member.id,
        username: member.username,
        displayName: member.displayName || undefined,
        email: member.email || undefined,
        level: level,
        subLevel: subLevel,
        userRole: member.userRole,
        referrerId: member.referredBy || undefined,
        joinedAt: member.createdAt.toISOString(),
        status: status
      };
    });
    
    return {
      members: memberInfos,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
      currentPage: page
    };
  } catch (error) {
    console.error('팀마스터에 속한 회원 목록 조회 오류:', error);
    throw error;
  }
}

/**
 * 팀마스터 설정 조회
 */
export async function fetchTeamMasterSettings(masterUserId: string) {
  try {
    // 팀마스터 사용자 정보 조회
    const user = await prisma.user.findUnique({
      where: {
        id: masterUserId
      },
      select: {
        username: true,
        displayName: true,
        email: true,
        userRole: true
      }
    });
    
    if (!user) {
      return null;
    }
    
    // 설정 정보 생성
    const settings: MasterSettings = {
      masterType: user.userRole === 1 ? 'admin' : 'regular',
      settings: {}
    };
    
    return settings;
  } catch (error) {
    console.error('팀마스터 설정 조회 오류:', error);
    throw error;
  }
}

/**
 * 사용자 정보 조회
 */
export async function fetchUserInfo(userId: string) {
  try {
    // 사용자 정보 조회
    const user = await prisma.user.findUnique({
      where: {
        id: userId
      },
      select: {
        username: true,
        displayName: true,
        email: true
      }
    });
    
    return user;
  } catch (error) {
    console.error('사용자 정보 조회 오류:', error);
    throw error;
  }
}

/**
 * 변경된 회원 목록 조회
 */
export async function fetchChangedMembers(
  masterUserId: string,
  fromDate?: string
) {
  try {
    // 기준 날짜 설정
    const startDate = fromDate ? new Date(fromDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 기본값: 7일 전
    
    // 모든 회원 조회
    const allMembers = await prisma.user.findMany({
      where: {
        teamMaster: masterUserId,
        username: { not: "" } // 탈퇴하지 않은 회원만 조회
      },
      select: {
        id: true,
        username: true,
        referredBy: true,
        createdAt: true,
        userRole: true
      }
    });
    
    // 회원 분류
    const addedMembers: MemberInfo[] = [];
    const updatedMembersList: MemberInfo[] = [];
    
    allMembers.forEach(member => {
      const memberInfo: MemberInfo = {
        userId: member.id,
        username: member.username,
        level: 0, // 기본 레벨 - 자격 없음
        subLevel: 0,
        userRole: member.userRole,
        referrerId: member.referredBy || undefined,
        joinedAt: member.createdAt.toISOString(),
        status: 'active'
      };
      
      // 최근에 추가된 회원은 added에, 그 외는 updated에 추가
      if (member.createdAt >= startDate) {
        addedMembers.push(memberInfo);
      } else {
        updatedMembersList.push(memberInfo);
      }
    });
    
    // 삭제된 회원 ID 목록 조회 (username이 "deleted_"로 시작하는 회원)
    const removedMembers = await prisma.user.findMany({
      where: {
        teamMaster: masterUserId,
        username: {
          startsWith: "deleted_"
        },
        subscriptionEndDate: {
          gte: startDate
        }
      },
      select: {
        id: true
      }
    });
    
    const removedMemberIds = removedMembers.map(member => member.id);
    
    return {
      added: addedMembers,
      updated: updatedMembersList,
      removed: removedMemberIds
    };
  } catch (error) {
    console.error('변경된 회원 목록 조회 오류:', error);
    throw error;
  }
}
