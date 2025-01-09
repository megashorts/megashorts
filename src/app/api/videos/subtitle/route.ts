import { validateRequest } from '@/auth';
import Cloudflare from 'cloudflare';

const client = new Cloudflare({
  apiEmail: process.env.CLOUDFLARE_EMAIL,
  apiKey: process.env.CLOUDFLARE_API_TOKEN  // API_KEY 대신 API_TOKEN 사용
});

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
  const { user } = await validateRequest();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const videoId = formData.get("videoId") as string;
    const language = formData.get("language") as string;

    if (!file || !videoId || !language) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    if (!accountId) {
      throw new Error("Cloudflare account ID not found");
    }

    // 파일 내용을 읽어서 직접 API 호출
    const bcp47Language = toBCP47(language);
    const arrayBuffer = await file.arrayBuffer();
    const vttFile = new File([arrayBuffer], file.name, { type: 'text/vtt' });

    // FormData로 직접 API 호출
    const cloudflareFormData = new FormData();
    cloudflareFormData.append('file', vttFile);

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/${videoId}/captions/${bcp47Language}`,
      {
        method: "PUT",
        headers: {
          'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
          'Accept': 'application/json'
        },
        body: cloudflareFormData
      }
    );

    if (!response.ok) {
      throw new Error('Failed to upload to Cloudflare');
    }

    const responseData = await response.json();

    // Cloudflare 응답 형식으로 반환
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

// import { validateRequest } from '@/auth';

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
//     const formData = await request.formData();
//     const file = formData.get("file") as File;
//     const videoId = formData.get("videoId") as string;
//     const language = formData.get("language") as string;

//     if (!file || !videoId || !language) {
//       return new Response("Missing required fields", { status: 400 });
//     }

//     const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
//     const apiToken = process.env.CLOUDFLARE_API_TOKEN;

//     if (!accountId || !apiToken) {
//       throw new Error("Cloudflare credentials not found");
//     }

//     const bcp47Language = toBCP47(language);
//     const arrayBuffer = await file.arrayBuffer();
//     const vttFile = new File([arrayBuffer], file.name, { type: 'text/vtt' });

//     const cloudflareFormData = new FormData();
//     cloudflareFormData.append('file', vttFile);

//     const response = await fetch(
//       `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/${videoId}/captions/${bcp47Language}`,
//       {
//         method: "PUT",
//         headers: {
//           'Authorization': `Bearer ${apiToken}`,
//           'Accept': 'application/json'
//         },
//         body: cloudflareFormData
//       }
//     );

//     if (!response.ok) {
//       throw new Error('Failed to upload to Cloudflare');
//     }

//     const responseText = await response.text();
//     let responseData;
//     try {
//       responseData = responseText ? JSON.parse(responseText) : null;
//     } catch (error) {
//       if (response.ok) {
//         // 응답이 비어있지만 성공한 경우
//         return Response.json({
//           success: true,
//           result: {
//             generated: true,
//             label: language,
//             language: language,
//             status: 'ready'
//           }
//         });
//       }
//       throw new Error(`Invalid response format: ${responseText}`);
//     }

//     // Cloudflare 응답 형식 그대로 반환
//     return Response.json(responseData);

//   } catch (error) {
//     console.error("Subtitle upload error:", error);
//     return Response.json({ 
//       success: false,
//       errors: [{ 
//         message: error instanceof Error ? error.message : "Upload failed" 
//       }]
//     }, { status: 500 });
//   }
// }
