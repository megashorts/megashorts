import { validateRequest } from '@/auth';
import prisma from '@/lib/prisma';
import { Language } from '@prisma/client';

function toBCP47(language: string): string {
  const languageMap: Record<string, string> = {
    'KOREAN': 'ko',
    'ENGLISH': 'en',
    'CHINESE': 'zh',
    'JAPANESE': 'ja',
    'THAI': 'th',
    'SPANISH': 'es',
    'INDONESIAN': 'id',
    'VIETNAMESE': 'vi'
  };
  return languageMap[language] || language.toLowerCase();
}

export async function POST(request: Request) {
  try {
    const { user } = await validateRequest();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const videoId = formData.get("videoId") as string;  // 이미 cloudflareId
    const language = formData.get("language") as string;

    console.log('Received request:', { 
      videoId, 
      language,
      fileName: file?.name,
      fileType: file?.type,
      fileSize: file?.size
    });

    if (!file || !videoId || !language) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    if (!accountId) {
      throw new Error("Cloudflare account ID not found");
    }

    // DB 조회 없이 바로 자막 업로드
    const bcp47Language = toBCP47(language);
    const arrayBuffer = await file.arrayBuffer();
    const vttFile = new File([arrayBuffer], file.name, { type: 'text/vtt' });

    const cloudflareFormData = new FormData();
    cloudflareFormData.append('file', vttFile);

    const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/${videoId}/captions/${bcp47Language}`;
    console.log('Cloudflare request:', { 
      url, 
      videoId,  // cloudflareId
      language: bcp47Language,
      fileName: vttFile.name,
      fileType: vttFile.type
    });

    const response = await fetch(url, {
      method: "PUT",
      headers: {
        'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`
      },
      body: cloudflareFormData
    });

    const responseText = await response.text();
    console.log('Cloudflare response:', {
      status: response.status,
      ok: response.ok,
      body: responseText
    });

    if (!response.ok) {
      throw new Error(`Failed to upload to Cloudflare: ${responseText}`);
    }

    // DB 업데이트는 하지 않음 (포스트 생성 시 처리)
    return Response.json({
      success: true,
      result: {
        generated: true,
        label: language,
        language: bcp47Language,
        status: 'ready'
      }
    });

  } catch (error) {
    console.error("Subtitle upload error:", error);
    return Response.json({
      success: false,
      errors: [{
        code: 1000,
        message: error instanceof Error ? error.message : "Upload failed"
      }]
    }, { status: 500 });
  }
}