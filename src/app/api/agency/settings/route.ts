// src/app/api/agency/settings/route.ts 팀마스터 지정설정에서 팀마스터 설정값 저장 및 불러오기

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
