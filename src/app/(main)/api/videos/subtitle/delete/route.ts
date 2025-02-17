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

    const bcp47Language = toBCP47(language);
    const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/${videoId}/captions/${bcp47Language}`;

    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`
      }
    });

    if (!response.ok && response.status !== 404) {
      throw new Error('Failed to delete subtitle');
    }

    return Response.json({ success: true });  // Response.json 사용
  } catch (error) {
    console.error("Subtitle deletion error:", error);
    return Response.json(  // Response.json 사용
      { error: "Failed to delete subtitle" }, 
      { status: 500 }
    );
  }
}


// import { validateRequest } from '@/auth';
// import prisma from '@/lib/prisma';

// function toBCP47(language: string): string {
//   const languageMap: Record<string, string> = {
//     'KOREAN': 'ko',
//     'ENGLISH': 'en',
//     'CHINESE': 'zh',
//     'JAPANESE': 'ja',
//     'THAI': 'th',
//     'SPANISH': 'es',
//     'INDONESIAN': 'id',
//     'VIETNAMESE': 'vi'
//   };
//   return languageMap[language] || language.toLowerCase();
// }

// export async function POST(request: Request) {
//   try {
//     const { user } = await validateRequest();
//     if (!user) {
//       return Response.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const { videoId, language } = await request.json();
//     if (!videoId || !language) {
//       return Response.json({ error: "Missing required fields" }, { status: 400 });
//     }

//     const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
//     if (!accountId) {
//       throw new Error("Cloudflare account ID not found");
//     }

//     // DB 조회 없이 바로 자막 삭제
//     const bcp47Language = toBCP47(language);
//     const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/${videoId}/captions/${bcp47Language}`;

//     const response = await fetch(url, {
//       method: "DELETE",
//       headers: {
//         'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`
//       }
//     });

//     if (!response.ok && response.status !== 404) {
//       throw new Error('Failed to delete subtitle');
//     }

//     return Response.json({ success: true });
//   } catch (error) {
//     console.error("Subtitle deletion error:", error);
//     return Response.json({ error: "Failed to delete subtitle" }, { status: 500 });
//   }
// }