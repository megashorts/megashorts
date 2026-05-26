import { NextRequest } from "next/server";
import { revalidatePath } from 'next/cache';
import prisma from "@/lib/prisma";
import { SliderSetting } from "@/lib/sliderSettings";
import { invalidateHomeContentFromAdmin } from "@/lib/content-revalidation";
import { localeCodes } from "@/i18n/config";

export async function GET() {
  try {
    const settings = await prisma.systemSetting.findUnique({
      where: { key: 'main_sliders' }
    });

    if (!settings) {
      return Response.json([]);
    }

    return Response.json(settings.value);
  } catch (error) {
    console.error('Failed to get slider settings:', error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const settings = await request.json() as SliderSetting[];

    await prisma.systemSetting.upsert({
      where: { key: 'main_sliders' },
      update: {
        value: settings,
      },
      create: {
        key: 'main_sliders',
        value: settings,
        valueType: 'json',
        description: '메인 페이지 슬라이더 설정'
      }
    });

    // 메인/최근/추천 및 태그 무효화
    invalidateHomeContentFromAdmin();

    // 영향 받는 카테고리 페이지들 재생성
    settings
      .filter(s => s.type === 'category')
      .forEach(s => {
        const path = s.categories && s.categories.length > 1
          ? `/categories/combined/${s.categories.join('-')}`
          : `/categories/${s.categories?.[0]}`;

        revalidatePath(path);
        localeCodes.forEach((locale) => {
          if (locale === "en") return;
          revalidatePath(`/${locale}${path}`);
        });
      });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Failed to save slider settings:', error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
