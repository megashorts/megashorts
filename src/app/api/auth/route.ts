
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
      return new Response(JSON.stringify({ error: "Unauthorized" }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { videoId, language } = await request.json();

    if (!videoId || !language) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 비디오 조회
    const video = await prisma.video.findUnique({
      where: { id: videoId }
    });

    if (!video) {
      return new Response(JSON.stringify({ error: "Video not found" }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const apiToken = process.env.CLOUDFLARE_API_TOKEN;

    if (!accountId || !apiToken) {
      return new Response(JSON.stringify({ error: "Cloudflare credentials not found" }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Cloudflare에서 자막 삭제
    const bcp47Language = toBCP47(language);
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/${videoId}/captions/${bcp47Language}`,
      {
        method: "DELETE",
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      return new Response(JSON.stringify({ error: "Failed to delete from Cloudflare" }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 비디오의 자막 언어 배열에서 해당 언어 제거
    const updatedSubtitles = video.subtitle.filter(lang => lang !== language);

    // 비디오 업데이트
    await prisma.video.update({
      where: { id: videoId },
      data: {
        subtitle: updatedSubtitles
      }
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("Subtitle delete error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Delete failed" 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// import { validateRequest } from "@/lib/auth";
// import prisma from "@/lib/prisma";


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
//   const { user } = await validateRequest();
//   if (!user) {
//     return new Response("Unauthorized", { status: 401 });
//   }

//   try {
//     const { videoId, subtitleId } = await request.json();

//     if (!videoId || !subtitleId) {
//       return new Response("Missing required fields", { status: 400 });
//     }

//     // 먼저 자막 정보를 데이터베이스에서 가져옴
//     const subtitle = await prisma.video.findUnique({
//       where: { id: subtitleId }
//     });

//     if (!subtitle) {
//       return new Response("Subtitle not found", { status: 404 });
//     }

//     const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
//     const apiToken = process.env.CLOUDFLARE_API_TOKEN;

//     if (!accountId || !apiToken) {
//       throw new Error("Cloudflare credentials not found");
//     }

//     const bcp47Language = toBCP47(subtitle.language);

//     // Cloudflare에서 자막 삭제
//     const response = await fetch(
//       `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/${videoId}/captions/${bcp47Language}`,
//       {
//         method: "DELETE",
//         headers: {
//           'Authorization': `Bearer ${apiToken}`,
//           'Accept': 'application/json'
//         }
//       }
//     );

//     if (!response.ok) {
//       throw new Error(`Failed to delete subtitle from Cloudflare: ${response.status}`);
//     }

//     // 데이터베이스에서 자막 정보 삭제
//     const video = await prisma.video.findUnique({
//       where: { id: videoId }
//     });
    
//     await prisma.video.update({
//       where: { id: videoId },
//       data: {
//         subtitle: video?.subtitle.filter(lang => lang !== subtitle)
//       }
//     });

//     return Response.json({ success: true });

//   } catch (error) {
//     console.error("Subtitle delete error:", error);
//     return new Response(
//       error instanceof Error ? error.message : "Delete failed",
//       { status: 500 }
//     );
//   }
// }