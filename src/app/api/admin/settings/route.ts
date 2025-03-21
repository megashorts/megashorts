import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { SystemSettings, type SystemSettingValue } from "@/lib/admin/system-settingspage";
import { SystemSetting } from "@prisma/client";

export async function GET() {
  try {
    const settings = await prisma.systemSetting.findMany();
    
    // Convert DB records to SystemSettings format
    const formattedSettings = settings.reduce((acc: Partial<SystemSettings>, setting: SystemSetting) => {
      // Convert DB value to SystemSettingValue format
      const dbValue = setting.value as { enabled: boolean; value: string | number | boolean };
      const settingValue: SystemSettingValue = {
        enabled: dbValue.enabled ?? true,
        value: dbValue.value
      };
      return {
        ...acc,
        [setting.key]: settingValue
      };
    }, {} as SystemSettings);

    return NextResponse.json(formattedSettings);
  } catch (error) {
    console.error('Failed to fetch settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { settings } = await req.json() as { settings: Record<string, SystemSettingValue> };

    // Update settings in parallel
    await Promise.all(
      Object.entries(settings).map(([key, value]) =>
        prisma.systemSetting.upsert({
          where: { key },
          create: {
            key,
            value: {
              enabled: value.enabled,
              value: value.value
            }
          },
          update: {
            value: {
              enabled: value.enabled,
              value: value.value
            }
          }
        })
      )
    );

    // // 설정 저장 후 시스템 설정 워커 호출
    // try {
    //   // 워커 URL 및 API 키 설정
    //   const workerUrl = process.env.NEXT_PUBLIC_SYSTEM_SETTINGS_WORKER_URL || 'https://system-settings.msdevcm.workers.dev';
      
    //   // API 키 확인
    //   const workerApiKey = process.env.WORKER_API_KEY;
    //   if (!workerApiKey) {
    //     console.error('환경 변수 WORKER_API_KEY가 설정되지 않았습니다.');
    //     throw new Error('환경 변수 WORKER_API_KEY가 설정되지 않았습니다.');
    //   }
      
    //   // DB에서 모든 설정 가져오기
    //   const dbSettings = await prisma.systemSetting.findMany();
      
    //   // 설정을 SystemSettings 형식으로 변환
    //   const formattedSettings = dbSettings.reduce((acc: Partial<SystemSettings>, setting: SystemSetting) => {
    //     const dbValue = setting.value as { enabled: boolean; value: string | number | boolean | any[] | object };
    //     return {
    //       ...acc,
    //       [setting.key]: {
    //         enabled: dbValue.enabled ?? true,
    //         value: dbValue.value
    //       }
    //     };
    //   }, {} as SystemSettings);
      
    //   // 워커 호출
    //   const workerResponse = await fetch(`${workerUrl}/collect-settings`, {
    //     method: 'POST',
    //     headers: {
    //       'Content-Type': 'application/json'
    //     },
    //     body: JSON.stringify({ settings: formattedSettings })
    //   });
      
    //   if (!workerResponse.ok) {
    //     console.warn('시스템 설정 워커 호출 실패:', await workerResponse.text());
    //     // 워커 호출 실패해도 설정 저장은 성공했으므로 성공 응답 반환
    //   } else {
    //     console.log('시스템 설정 워커 호출 성공');
    //   }
    // } catch (workerError) {
    //   console.warn('시스템 설정 워커 호출 중 오류:', workerError);
    //   // 워커 호출 실패해도 설정 저장은 성공했으므로 성공 응답 반환
    // }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to save settings:', error);
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    );
  }
}
