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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to save settings:', error);
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    );
  }
}
