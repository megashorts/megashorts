import { validateRequest } from '@/auth';

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

    const { videoId, language } = await request.json();
    
    if (!videoId || !language) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    if (!accountId) {
      throw new Error("Cloudflare account ID not found");
    }

    // SDK 대신 직접 API 호출
    const bcp47Language = toBCP47(language);
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/${videoId}/captions/${bcp47Language}`,
      {
        method: "DELETE",
        headers: {
          'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(JSON.stringify(error));
    }

    // Cloudflare 응답 형식으로 반환
    return Response.json({
      success: true,
      result: ""
    });

  } catch (error) {
    console.error("Delete subtitle error:", error);
    return Response.json({
      success: false,
      errors: [{
        code: 1000,
        message: error instanceof Error ? error.message : "Failed to delete subtitle"
      }]
    }, { status: 500 });
  }
}