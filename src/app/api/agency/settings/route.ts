// src/app/api/agency/settings/route.ts

import { validateRequest } from '@/auth';
import prisma from '@/lib/prisma';
import { USER_ROLE } from '@/lib/constants';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { user } = await validateRequest();
    
    if (!user || user.userRole < USER_ROLE.TEAM_MEMBER) {
      return Response.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    
    if (!userId) {
      return Response.json(
        { success: false, error: "Missing userId parameter" },
        { status: 400 }
      );
    }
    
    // 시스템 설정에서 에이전시 설정 조회
    const settings = await prisma.systemSetting.findFirst({
      where: {
        key: `agencySettings_${userId}`,
      }
    });
    
    // 기본 설정 데이터 - 사용자가 처음 설정할 때 UI에 표시될 초기값
    // 실제 저장 시에는 사용자가 설정한 값으로 대체됨
    // 단계는 무한 확장 가능하며, 이 기본값은 단지 초기 UI 표시용임
    const defaultSettings = {
      userId,
      masterType: "HEADQUARTERS", // 기본 타입
      settings: {
        defaultCommissionRate: 10, // 기본 수수료율
        // 각 타입별 기본 설정은 UI에서 동적으로 생성/수정 가능
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    if (!settings) {
      // 기본 설정 반환
      return Response.json({
        success: true,
        data: defaultSettings
      });
    }
    
    // 설정 값이 유효한 JSON인지 확인
    let settingsValue;
    try {
      // 이미 객체인 경우
      if (typeof settings.value === 'object') {
        settingsValue = settings.value;
      } 
      // 문자열인 경우 파싱
      else if (typeof settings.value === 'string') {
        settingsValue = JSON.parse(settings.value);
      } 
      // 그 외의 경우 기본값 사용
      else {
        settingsValue = defaultSettings;
      }
    } catch (e) {
      console.error("Invalid settings value:", e);
      settingsValue = defaultSettings;
    }
    
    return Response.json({
      success: true,
      data: settingsValue
    });
  } catch (error) {
    console.error("Error fetching agency settings:", error);
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await validateRequest();
    
    if (!user || user.userRole < USER_ROLE.TEAM_MASTER) {
      return Response.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const data = await request.json();
    
    if (!data.userId || !data.masterType || !data.settings) {
      return Response.json(
        { success: false, error: "Invalid settings data" },
        { status: 400 }
      );
    }
    
    // 시스템 설정에 에이전시 설정 저장
    await prisma.systemSetting.upsert({
      where: {
        key: `agencySettings_${data.userId}`
      },
      update: {
        value: data,
        updatedAt: new Date()
      },
      create: {
        key: `agencySettings_${data.userId}`,
        value: data,
        valueType: "json",
        description: "Agency settings",
        updatedBy: user.id
      }
    });
    
    // // 사용자 정보 가져오기
    // const userInfo = await prisma.user.findUnique({
    //   where: { id: data.userId },
    //   select: { username: true, displayName: true, email: true }
    // });
    
    // if (!userInfo) {
    //   throw new Error(`사용자 정보를 찾을 수 없음: ${data.userId}`);
    // }
    
    // // 설정 데이터에 username 추가
    // const settingsWithUsername = {
    //   ...data,
    //   username: userInfo.username,
    //   displayName: userInfo.displayName || userInfo.username,
    //   email: userInfo.email
    // };
    
    // // 팀마스터 설정 워커 호출
    // try {
    //   console.log('팀마스터 설정 워커 호출 시도...');
      
    //   // 워커 URL 설정
    //   const workerUrl = process.env.TEAM_MASTER_SETTINGS_WORKER_URL || 'https://team-master-settings.msdevcm.workers.dev';
    //   console.log(`워커 URL: ${workerUrl}`);
      
    //   // API 키 확인
    //   const apiKey = process.env.WORKER_API_KEY;
    //   if (!apiKey) {
    //     console.error('환경 변수 WORKER_API_KEY가 설정되지 않았습니다.');
    //     throw new Error('환경 변수 WORKER_API_KEY가 설정되지 않았습니다.');
    //   }
      
    //   // 워커 호출
    //   const workerResponse = await fetch(`${workerUrl}/update-settings`, {
    //     method: 'POST',
    //     headers: {
    //       'Content-Type': 'application/json',
    //       'Authorization': `Bearer ${apiKey}`
    //     },
    //     body: JSON.stringify({
    //       masterName: userInfo.username,
    //       settings: settingsWithUsername
    //     })
    //   });
      
    //   if (workerResponse.ok) {
    //     const workerResult = await workerResponse.json();
    //     console.log('워커 호출 성공:', workerResult);
    //   } else {
    //     console.error('워커 호출 실패:', await workerResponse.text());
    //   }
    // } catch (workerError) {
    //   console.error('팀마스터 설정 워커 호출 오류:', workerError);
    //   // 워커 호출 실패는 무시하고 계속 진행
    // }
    
    // // 추천인 구조 업데이트 호출
    // try {
    //   console.log('추천인 구조 업데이트 시도...');
      
    //   // 워커 URL 설정
    //   const referralWorkerUrl = process.env.REFERRAL_STRUCTURE_WORKER_URL || 'https://referral-structure.msdevcm.workers.dev';
    //   console.log(`추천인 구조 워커 URL: ${referralWorkerUrl}`);
      
    //   // API 키 확인
    //   const apiKey = process.env.WORKER_API_KEY;
    //   if (!apiKey) {
    //     console.error('환경 변수 WORKER_API_KEY가 설정되지 않았습니다.');
    //     throw new Error('환경 변수 WORKER_API_KEY가 설정되지 않았습니다.');
    //   }
      
    //   // 추천인 구조 워커의 settings-update 엔드포인트 직접 호출
    //   const referralStructureResponse = await fetch(`${referralWorkerUrl}/event/settings-update`, {
    //     method: 'POST',
    //     headers: {
    //       'Content-Type': 'application/json',
    //       'Authorization': `Bearer ${apiKey}`
    //     },
    //     body: JSON.stringify({
    //       masterUserId: data.userId,
    //       settings: data.settings,
    //       userInfo: {
    //         username: userInfo.username,
    //         displayName: userInfo.displayName,
    //         email: userInfo.email
    //       }
    //     })
    //   });
      
    //   if (referralStructureResponse.ok) {
    //     const referralResult = await referralStructureResponse.json();
    //     console.log('추천인 구조 업데이트 성공:', referralResult);
        
    //     // 워커 응답 반환
    //     return Response.json({
    //       success: true,
    //       data: { saved: true },
    //       referralResult
    //     });
    //   } else {
    //     console.error('추천인 구조 업데이트 실패:', await referralStructureResponse.text());
    //   }
    // } catch (workerError) {
    //   console.error('워커 호출 오류:', workerError);
    //   // 워커 호출 실패는 무시하고 계속 진행 (데이터는 여전히 반환)
    // }
    
    return Response.json({
      success: true,
      data: { saved: true }
    });
  } catch (error) {
    console.error("Error saving agency settings:", error);
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
