import { validateRequest } from '@/auth';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  const { user } = await validateRequest();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const { videoId } = await request.json();  // dbId 제거
    if (!videoId) {
      console.error('Missing videoId:', { videoId });
      return new Response("Video ID is required", { status: 400 });
    }

    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    if (!accountId) {
      throw new Error("Cloudflare account ID not found");
    }

    // Cloudflare에서 비디오 삭제
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/${videoId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json'
        },
      }
    );

    if (!response.ok && response.status !== 404) {
      throw new Error('Failed to delete video');
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Video deletion error:", error);
    return new Response(
      error instanceof Error ? error.message : "Failed to delete video",
      { status: 500 }
    );
  }
}

// import { validateRequest } from '@/auth';
// import prisma from '@/lib/prisma';

// export async function POST(request: Request) {
//     const { user } = await validateRequest();
//     if (!user) {
//       return new Response("Unauthorized", { status: 401 });
//     }
  
//     try {
//       const { videoId, dbId } = await request.json();  // dbId 추가
//       if (!videoId || !dbId) {
//         return new Response("Video ID and database ID are required", { status: 400 });
//       }
  
//       const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
//       if (!accountId) {
//         throw new Error("Cloudflare account ID not found");
//       }

//       console.log('Attempting to delete video:', { 
//         videoId,
//         dbId,
//         accountId: accountId,
//         hasToken: !!process.env.CLOUDFLARE_API_TOKEN
//       });
  
//       // 1. Cloudflare에서 비디오 삭제 시도
//       const response = await fetch(
//         `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/${videoId}`,
//         {
//           method: "DELETE",
//           headers: {
//             Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
//             'Content-Type': 'application/json'
//           },
//         }
//       );

//       const responseText = await response.text();
//       console.log('Cloudflare delete response:', {
//         status: response.status,
//         ok: response.ok,
//         body: responseText
//       });
  
//       // 2. 클라우드플레어 삭제가 성공했거나 이미 삭제된 경우(404)
//       if (response.ok || response.status === 404) {
//         // 3. 데이터베이스에서 비디오 삭제
//         await prisma.video.delete({
//           where: { id: dbId }
//         });

//         return Response.json({ success: true });
//       }

//       throw new Error(`Failed to delete video from Cloudflare: ${responseText}`);
//     } catch (error) {
//       console.error("Video deletion error:", error);
//       return new Response(
//         error instanceof Error ? error.message : "Failed to delete video",
//         { status: 500 }
//       );
//     }
// }